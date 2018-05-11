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


import gtk

from pigeonplanner.ui import utils
from pigeonplanner.core import common


class SexEntry(gtk.Viewport):
    __gtype_name__ = "SexEntry"
    def __init__(self):
        gtk.Viewport.__init__(self)

        self._entry = gtk.Entry()
        self._entry.set_has_frame(False)
        self._entry.set_editable(False)
        self._entry.set_icon_activatable(0, False)
        self.add(self._entry)
        self.show_all()

    def set_sex(self, sex):
        try:
            img = utils.get_sex_image(sex)
        except KeyError:
            img = None
            self._entry.set_text("")
        else:
            self._entry.set_text(common.get_sex(sex))
        self._entry.set_icon_from_pixbuf(0, img)

