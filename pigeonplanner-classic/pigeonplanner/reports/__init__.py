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


from pigeonplanner.core import config


def get_pedigree(layout=None):
    if layout is None:
        layout = config.get("printing.pedigree-layout")

    if layout == 0:
        from .pedigrees.original import PedigreeReport, PedigreeReportOptions
    elif layout == 1:
        from .pedigrees.swapped_details import PedigreeReport, PedigreeReportOptions
    elif layout == 2:
        from .pedigrees.middle import PedigreeReport, PedigreeReportOptions

    return PedigreeReport, PedigreeReportOptions

