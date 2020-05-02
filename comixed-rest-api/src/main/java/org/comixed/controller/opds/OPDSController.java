/*
 * ComiXed - A digital comic book library management application.
 * Copyright (C) 2018, The ComiXed Project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses>
 */

package org.comixed.controller.opds;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.text.ParseException;
import java.util.Date;
import java.util.Optional;
import javax.imageio.ImageIO;
import javax.swing.*;
import lombok.extern.log4j.Log4j2;
import org.comixed.model.comic.Comic;
import org.comixed.model.comic.Page;
import org.comixed.repositories.comic.ComicRepository;
import org.comixed.service.library.NoSuchReadingListException;
import org.comixed.service.library.ReadingListService;
import org.comixed.utils.FileTypeIdentifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import sun.awt.image.ToolkitImage;

/**
 * <code>OPDSController</code> provides the web interface for accessing the OPDS feeds.
 *
 * @author João França
 * @author Giao Phan
 * @author Darryl L. Pierce
 */
@RestController
@Log4j2
public class OPDSController {
  @Autowired private ComicRepository comicRepository;
  @Autowired private ReadingListService readingListService;
  @Autowired private FileTypeIdentifier fileTypeIdentifier;

  @ResponseBody
  @GetMapping(value = "/opds-comics", produces = MediaType.APPLICATION_XML_VALUE)
  @CrossOrigin
  public OPDSFeed getNavigationFeed() throws ParseException {
    return new OPDSNavigationFeed();
  }

  @ResponseBody
  @GetMapping(value = "/opds-comics/all", produces = MediaType.APPLICATION_XML_VALUE)
  @CrossOrigin
  public OPDSFeed getAllComics() throws ParseException {
    return new OPDSAcquisitionFeed("/opds/all", "Comics - ", this.comicRepository.findAll());
  }

  @ResponseBody
  @GetMapping(
      value = "/opds/all",
      params = {"groupByFolder"},
      produces = MediaType.APPLICATION_XML_VALUE)
  @CrossOrigin
  public OPDSFeed getAllLists() throws ParseException {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return new OPDSNavigationFeed(
        "/opds/all?groupByFolder=true",
        "Comics - ",
        this.readingListService.getReadingListsForUser(authentication.getName(), new Date(0L)));
  }

  @ResponseBody
  @GetMapping(value = "/opds/{id}", produces = MediaType.APPLICATION_XML_VALUE)
  @CrossOrigin
  public OPDSFeed getList(@PathVariable("id") long id)
      throws ParseException, NoSuchReadingListException {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return new OPDSNavigationFeed(
        "/opds/" + id,
        "Comics - ",
        this.readingListService.getReadingListForUser(authentication.getName(), id));
  }

  @GetMapping(value = "/opds/feed/comics/{id}/download/{filename}")
  @CrossOrigin
  public ResponseEntity<InputStreamResource> downloadComic(
      @PathVariable("id") long id, @PathVariable("filename") String filename)
      throws FileNotFoundException, IOException {
    this.log.debug("Attempting to download comic: id={}", id);

    Optional<Comic> record = this.comicRepository.findById(id);

    if (!record.isPresent()) {
      this.log.error("No such comic");
      return null;
    }

    Comic comic = record.get();
    File file = new File(comic.getFilename());

    if (!file.exists() || !file.isFile()) {
      this.log.error("Missing or invalid comic file: {}", comic.getFilename());
      return null;
    }

    InputStreamResource resource = new InputStreamResource(new FileInputStream(file));

    return ResponseEntity.ok()
        .contentLength(file.length())
        .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.parseMediaType(comic.getArchiveType().getMimeType().toString()))
        .body(resource);
  }

  @GetMapping(value = "/opds/feed/comics/{id}/{index}/{maxWidth}")
  @CrossOrigin
  public ResponseEntity<byte[]> getImageInComicByIndex(
      @PathVariable("id") long id,
      @PathVariable("index") int index,
      @PathVariable("maxWidth") int maxWidth)
      throws IOException {
    this.log.debug("Getting the image for comic: id={} index={}", id, index);

    Optional<Comic> record = this.comicRepository.findById(id);

    if (record.isPresent() && (index < record.get().getPageCount())) {
      Page page = record.get().getPage(index);
      byte[] content = page.getContent();

      ByteArrayInputStream bais = new ByteArrayInputStream(content);
      BufferedImage image = ImageIO.read(bais);

      if (maxWidth != 0 && maxWidth < image.getWidth()) {

        ToolkitImage scaled =
            (ToolkitImage) image.getScaledInstance(maxWidth, -1, Image.SCALE_SMOOTH);

        Image temporary = new ImageIcon(scaled).getImage();
        BufferedImage buffered =
            new BufferedImage(scaled.getWidth(), scaled.getHeight(), BufferedImage.TYPE_INT_RGB);

        Graphics2D g2d = buffered.createGraphics();
        g2d.drawImage(temporary, 0, 0, null);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(buffered, "jpg", baos);
        baos.flush();
        content = baos.toByteArray();
        baos.close();
      }

      String type =
          this.fileTypeIdentifier.typeFor(new ByteArrayInputStream(content))
              + "/"
              + this.fileTypeIdentifier.subtypeFor(new ByteArrayInputStream(content));
      this.log.debug("Image {} mimetype: {}", index, type);
      return ResponseEntity.ok()
          .contentLength(content.length)
          .contentType(MediaType.valueOf(type))
          .body(content);
    }

    if (!record.isPresent()) {
      this.log.debug("Could now download page. No such comic: id={}", id);
    } else {
      this.log.debug("No such page: index={} page count={}", index, record.get().getPageCount());
    }

    return null;
  }
}
