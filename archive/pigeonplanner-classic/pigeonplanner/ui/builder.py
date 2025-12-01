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

"""
Interface for Gtkbuilder
"""


import os

import gtk

from pigeonplanner.ui import WidgetFactory
from pigeonplanner.core import const


class GtkBuilder(WidgetFactory):
    def __init__(self, uifile, objects=None):
        """
        Initialize Gtkbuilder, connect all signals and get all widgets

        @param uifile: Filename of the Glade file
        @param objects: List of root widgets
        """

        WidgetFactory.__init__(self)

        self._builder = gtk.Builder()
        self._builder.set_translation_domain(const.DOMAIN)
        uipath = os.path.join(const.GLADEDIR, uifile)
        if objects is None:
            self._builder.add_from_file(uipath)
        else:
            self._builder.add_objects_from_file(uipath, objects)
        self._builder.connect_signals(self)
        self.set_builder_objects(self._builder.get_objects())

    def get_objects_from_prefix(self, prefix):
        """
        Retrieve all widgets starting with the given prefix

        @param prefix: The prefix to search for
        """

        objects = []
        for name, obj in self.widgets.items():
            if name.startswith(prefix):
                objects.append(obj)
        return objects

    def get_object_name(self, obj):
        """
        Get the widget name of the object

        @param obj: The object to get the name from 
        """

        return gtk.Buildable.get_name(obj)

