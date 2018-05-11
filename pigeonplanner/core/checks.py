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
Provides functions to check various entries
"""


from pigeonplanner import messages
from pigeonplanner.core import errors


def check_ring_entry(inputRing, inputYear):
    """
    Check if the ring and year input are valid
    
    @param inputRing: The ringnumber to check
    @param inputYear: the year to check
    """

    if not inputRing or not inputYear:
        raise errors.InvalidInputError(messages.MSG_EMPTY_FIELDS)

    elif not inputYear.isdigit():
        raise errors.InvalidInputError(messages.MSG_INVALID_NUMBER)

    elif not len(inputYear) == 4:
        raise errors.InvalidInputError(messages.MSG_INVALID_LENGTH)

