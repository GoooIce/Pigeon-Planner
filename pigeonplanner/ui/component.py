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


class ComponentAlreadyRegistered(Exception):
    pass


class Component(object):
    def __init__(self, name):
        self._component_name = name
        _ComponentRegistry.register(self)

    def __del__(self):
        if _ComponentRegistry:
            _ComponentRegistry.deregister(self._component_name)


class ComponentRegistry(object):
    def __init__(self):
        self.components = {}

    def register(self, obj):
        name = obj._component_name
        if name in self.components:
            raise ComponentAlreadyRegistered(
                "Component already registered with name %s" % name)

        self.components[name] = obj

    def deregister(self, name):
        if name in self.components:
            del self.components[name]


_ComponentRegistry = ComponentRegistry()
deregister = _ComponentRegistry.deregister

def get(name):
    return _ComponentRegistry.components[name]

