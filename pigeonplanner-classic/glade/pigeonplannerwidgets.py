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
import sys
sys.path.insert(0, os.path.abspath('..'))

import __builtin__
__builtin__._ = lambda x: x

from pigeonplanner.ui.widgets import bandentry
from pigeonplanner.ui.widgets import date
from pigeonplanner.ui.widgets import checkbutton
from pigeonplanner.ui.widgets import comboboxes
from pigeonplanner.ui.widgets import latlongentry
from pigeonplanner.ui.widgets import sexentry
from pigeonplanner.ui.widgets import statusbar

