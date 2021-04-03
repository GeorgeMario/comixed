/*
 * ComiXed - A digital comic book library management application.
 * Copyright (C) 2020, The ComiXed Project.
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

package org.comixedproject.controller.comic;

import java.security.Principal;
import lombok.extern.log4j.Log4j2;
import org.comixedproject.model.comic.ComicFormat;
import org.comixedproject.model.messaging.Constants;
import org.comixedproject.model.messaging.EndOfList;
import org.comixedproject.service.comic.ComicFormatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

/**
 * <code>ComicFormatController</code> provides a set of REST APIs for working with the instances of
 * {@link ComicFormat}.
 *
 * @author Darryl L. Pierce
 */
@RestController
@Log4j2
public class ComicFormatController {

  @Autowired private ComicFormatService comicFormatService;
  @Autowired private SimpMessagingTemplate messagingTemplate;

  /**
   * Retrieves the list of all comic formats and publishes them.
   *
   * @param principal the user principal
   */
  @MessageMapping(Constants.LOAD_COMIC_FORMATS)
  public void getAll(final Principal principal) {
    log.info("Getting all comic formats for {}", principal.getName());
    this.comicFormatService
        .getAll()
        .forEach(
            comicFormat -> {
              log.trace("Sending comic format: {}", comicFormat.getName());
              this.messagingTemplate.convertAndSendToUser(
                  principal.getName(), Constants.COMIC_FORMAT_UPDATE_TOPIC, comicFormat);
            });
    log.trace("Sending end of list");
    this.messagingTemplate.convertAndSendToUser(
        principal.getName(), Constants.COMIC_FORMAT_UPDATE_TOPIC, EndOfList.MESSAGE);
  }
}
