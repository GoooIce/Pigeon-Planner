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

import gtk
import gtk.gdk

from pigeonplanner.ui import component
from pigeonplanner.core import const


class BaseTab(component.Component):
    def __init__(self, name, title, img):
        component.Component.__init__(self, name)

        self._parent = component.get("MainWindow")

        self.widgets._label = gtk.VBox()
        img = os.path.join(const.IMAGEDIR, img)
        if gtk.gdk.screen_height() <= 768:
            self.widgets._label.set_orientation(gtk.ORIENTATION_HORIZONTAL)
            pixbuf = gtk.gdk.pixbuf_new_from_file_at_size(img, 18, 18)
        else:
            pixbuf = gtk.gdk.pixbuf_new_from_file(img)
        image = gtk.image_new_from_pixbuf(pixbuf)
        label = gtk.Label(title)
        self.widgets._label.pack_start(image)
        self.widgets._label.pack_start(label)
        self.widgets._label.show_all()

    def get_tab_widgets(self):
        return self.widgets._root, self.widgets._label

    def set_pigeon(self, pigeon):
        pass

    def clear_pigeon(self):
        pass

    def get_pigeon_state_widgets(self):
        """ List of widgets that need a 'sensitive' property update whenever
        a pigeon is selected/deselected in the main treeview.
        """
        return []

