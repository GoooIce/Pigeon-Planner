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


import os.path
import logging
logger = logging.getLogger(__name__)

import gtk

from pigeonplanner.core import pigeonparser
from pigeonplanner.export import get_exporters
from pigeonplanner.ui import builder
from pigeonplanner.ui import component
from pigeonplanner.ui import filechooser
from pigeonplanner.ui.messagedialog import ErrorDialog


class ExportWindow(builder.GtkBuilder):
    def __init__(self, parent):
        builder.GtkBuilder.__init__(self, "ExportWindow.ui")

        self._parent = parent

        for exporter in get_exporters():
            self.widgets.typelist.append([exporter, exporter.name])
        self.widgets.combotype.set_active(0)

        self.widgets.window.set_transient_for(parent)
        self.widgets.window.show_all()

    def on_window_delete_event(self, widget, event):
        self.widgets.window.destroy()
        return False

    def on_buttonclose_clicked(self, widget):
        self.widgets.window.destroy()
        return False

    def on_buttonexport_clicked(self, widget):
        filepath = self.widgets.entrypath.get_text()
        path = os.path.dirname(filepath)
        if not os.path.exists(path) or os.path.isdir(filepath):
            ErrorDialog((_("Invalid input!"), None, _("Error")), self.widgets.window)
            return
        self.widgets.imageprogress.hide()
        self.widgets.spinner.show()
        self.widgets.spinner.start()

        treeview = component.get("Treeview")
        if self.widgets.radioselected.get_active():
            pigeons = treeview.get_selected_pigeon()
            # pigeons can be a list of selected or just one pigeon object.
            if not isinstance(pigeons, list):
                pigeons = [pigeons]
        elif self.widgets.radiovisible.get_active():
            pigeons = treeview.get_pigeons(True)
        else:
            pigeons = pigeonparser.parser.pigeons.values()
        exporter = self.__get_exporter()
        try:
            exporter.run(filepath, pigeons)
        except IOError as e:
            logger.exception(e)
            ErrorDialog(
                (_("The selected path is not writeable."), None, _("Error")),
                self.widgets.window
            )
        else:
            self.widgets.imageprogress.show()

        self.widgets.spinner.hide()
        self.widgets.spinner.stop()

    def on_entrypath_changed(self, widget):
        value = widget.get_text_length() != 0
        self.widgets.buttonexport.set_sensitive(value)

    def on_entrypath_icon_press(self, widget, icon_pos, event):
        exporter = self.__get_exporter()
        dialog = filechooser.ExportChooser(self.widgets.window, exporter.extension,
                                                        exporter.filefilter)
        response = dialog.run()
        if response == gtk.RESPONSE_OK:
            widget.set_text(dialog.get_filename())
        dialog.destroy()

    def __get_exporter(self):
        ls_iter = self.widgets.combotype.get_active_iter()
        return self.widgets.typelist.get(ls_iter, 0)[0]

