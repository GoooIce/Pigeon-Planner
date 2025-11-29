# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


import os
import operator

import gtk

from pigeonplanner import mime
from pigeonplanner import messages
from pigeonplanner import database
from pigeonplanner import thumbnail
from pigeonplanner.ui import utils
from pigeonplanner.ui import builder
from pigeonplanner.ui import filechooser
from pigeonplanner.ui.tabs import basetab
from pigeonplanner.ui.messagedialog import QuestionDialog
from pigeonplanner.core import common


class MediaTab(builder.GtkBuilder, basetab.BaseTab):
    def __init__(self):
        builder.GtkBuilder.__init__(self, "MediaView.ui")
        basetab.BaseTab.__init__(self, "MediaTab", _("Media"), "icon_media.png")

        self.widgets.selection = self.widgets.treeview.get_selection()
        self.widgets.selection.set_select_function(self._select_func, full=True)
        self.widgets.selection.connect("changed", self.on_selection_changed)

    def on_selection_changed(self, selection):
        model, rowiter = selection.get_selected()
        widgets = [self.widgets.buttonremove, self.widgets.buttonopen]
        utils.set_multiple_sensitive(widgets, not rowiter is None)
        self.widgets.image.clear()
        if rowiter is None: return

        mimetype = model.get_value(rowiter, 1)
        if mime.is_image(mimetype):
            path = unicode(model.get_value(rowiter, 2))
            self.widgets.image.set_from_pixbuf(thumbnail.get_image(path))
        else:
            try:
                image = mime.get_pixbuf(mimetype)
                self.widgets.image.set_from_pixbuf(image)
            except mime.MimeIconError:
                self.widgets.image.set_from_stock(gtk.STOCK_FILE,
                                                  gtk.ICON_SIZE_DIALOG)

    def on_buttonopen_clicked(self, widget):
        model, rowiter = self.widgets.selection.get_selected()
        common.open_file(model.get_value(rowiter, 2))

    def on_buttonadd_clicked(self, widget):
        chooser = filechooser.MediaChooser(self._parent)
        response = chooser.run()
        if response == gtk.RESPONSE_OK:
            data = {"pindex":self.pigeon.get_pindex(), "type": chooser.get_filetype(),
                    "path": chooser.get_filename(), "title": chooser.get_filetitle(),
                    "description": chooser.get_filedescription()}
            database.add_media(data)
            # Hackish... Fill whole treeview again
            self.set_pigeon(self.pigeon)
        chooser.destroy()

    def on_buttonremove_clicked(self, widget):
        if not QuestionDialog(messages.MSG_REMOVE_MEDIA, self._parent).run():
            return

        model, rowiter = self.widgets.selection.get_selected()
        if mime.is_image(model.get_value(rowiter, 1)):
            try:
                os.remove(thumbnail.get_path(model.get_value(rowiter, 2)))
            except:
                pass
        database.remove_media({"Mediakey": model.get_value(rowiter, 0)})
        self.widgets.liststore.remove(rowiter)
        path = self.widgets.liststore.get_path(rowiter)
        self.widgets.selection.select_path(path)

    def set_pigeon(self, pigeon):
        self.pigeon = pigeon

        images = []
        other = []
        self.widgets.liststore.clear()
        for media in database.get_media_for_pigeon(pigeon.pindex):
            if mime.is_image(media[2]):
                images.append(media)
            else:
                other.append(media)
        images.sort(key=operator.itemgetter(4))
        other.sort(key=operator.itemgetter(4))

        normal = ["#ffffff", True]
        self.widgets.liststore.append(["", "", "", _("Images"), "#dcdcdc", False])
        for media in images:
            text = self._format_text(media[4], media[5])
            self.widgets.liststore.append([media[0], media[2], media[3], text]+normal)
        self.widgets.liststore.append(["", "", "", _("Other"), "#dcdcdc", False])
        for media in other:
            text = self._format_text(media[4], media[5])
            self.widgets.liststore.append([media[0], media[2], media[3], text]+normal)

    def clear_pigeon(self):
        self.widgets.liststore.clear()

    def get_pigeon_state_widgets(self):
        return [self.widgets.buttonadd]

    def _format_text(self, title, description):
        text = common.escape_text(title)
        if description:
            text += " - <span style=\"italic\" size=\"smaller\">%s</span>"\
                        % common.escape_text(description)
        return text

    def _select_func(self, selection, model, path, is_selected):
        return model[path][5]

