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


import nose.tools as nt

from pigeonplanner.core import errors
from pigeonplanner.core import checks


def test_band_check():
    # Both empty
    band = ""
    year = ""
    nt.assert_raises(errors.InvalidInputError, checks.check_ring_entry, band, year)
    # Ring empty
    band = ""
    year = "2014"
    nt.assert_raises(errors.InvalidInputError, checks.check_ring_entry, band, year)
    # Year empty
    band = "BE-1234567"
    year = ""
    nt.assert_raises(errors.InvalidInputError, checks.check_ring_entry, band, year)
    # Year is not in digits
    band = "BE-1234567"
    year = "abcd"
    nt.assert_raises(errors.InvalidInputError, checks.check_ring_entry, band, year)
    # Year is not 4 digits
    band = "BE-1234567"
    year = "201"
    nt.assert_raises(errors.InvalidInputError, checks.check_ring_entry, band, year)
    # Correct band. Returning None means no error was raised and the input is ok.
    band = "BE-1234567"
    year = "2014"
    value = checks.check_ring_entry(band, year)
    nt.assert_is_none(value)

