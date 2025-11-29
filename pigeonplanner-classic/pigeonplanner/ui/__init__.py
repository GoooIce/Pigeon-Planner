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


class _Widgets(dict):
    """ Object to hold all widgets
    """

    def __iter__(self):
        return self.itervalues()

    def __getattr__(self, name):
        return self[name]

    def __setattr__(self, name, value):
        self[name] = value


class WidgetFactory(object):
    def __init__(self):
        self.widgets = _Widgets()

    def set_builder_objects(self, objects):
        for obj in objects:
            if issubclass(type(obj), gtk.Buildable):
                self.widgets[gtk.Buildable.get_name(obj)] = obj

