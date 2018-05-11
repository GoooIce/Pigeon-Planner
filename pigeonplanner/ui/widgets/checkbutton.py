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


class DisplayCheckButton(gtk.CheckButton):
    """
    This class subclasses gtk.CheckButton which we will use to display
    the status of some data. Because this is just an indicator,
    the user isn't allowed to change its state.

    We achieve this by overriding the "pressed" and "released" signals
    and do nothing in them.
    """

    __gtype_name__ = "DisplayCheckButton"

    def __init__(self, label=None):
        gtk.CheckButton.__init__(self, label)
        self.show()

    def do_pressed(self):
        pass

    def do_released(self):
        pass

