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


import sqlite3

import nose.tools as nt
from . import utils

from pigeonplanner import database
from pigeonplanner.core import const


def test_connection():
    nt.assert_equal(database.session.dbfile, const.DATABASE)
    nt.assert_false(database.session.is_new_db)
    nt.assert_is_instance(database.session.connection, sqlite3.Connection)
    nt.assert_is_instance(database.session.cursor, sqlite3.Cursor)
test_connection.setup = database.session.open
test_connection.teardown = database.session.close

def test_new_database():
    nt.assert_equal(database.session.dbfile, utils.DBFILE)
    nt.assert_true(database.session.is_new_db)
test_new_database.setup = utils.open_test_db
test_new_database.teardown = utils.close_test_db

def test_database_version():
    value = database.session.get_database_version()
    nt.assert_equal(value, database.Schema.VERSION)
    database.session.set_database_version(999)
    value = database.session.get_database_version()
    nt.assert_equal(value, 999)
test_database_version.setup = utils.open_test_db
test_database_version.teardown = utils.close_test_db

def test_database_helper_methods():
    # Check table names
    schema_names = database.Schema.get_table_names()
    database_names = database.session.get_table_names()
    nt.assert_list_equal(schema_names, database_names)
    # Check column names
    schema_names = database.Schema.get_column_names(database.Tables.PIGEONS)
    database_names = database.session.get_column_names(database.Tables.PIGEONS)
    nt.assert_list_equal(schema_names, database_names)
    # Add a new column
    database.session.add_column(database.Tables.PIGEONS, "test TEXT")
    column_names = database.session.get_column_names(database.Tables.PIGEONS)
    nt.assert_in("test", column_names)
    # Remove a table
    database.session.remove_table(database.Tables.MEDIA)
    table_names = database.session.get_table_names()
    nt.assert_not_in(database.Tables.MEDIA, table_names)
    # Add a table
    database.session.add_table(database.Tables.MEDIA,
                               database.Schema.get_columns_sql(database.Tables.MEDIA))
    table_names = database.session.get_table_names()
    nt.assert_in(database.Tables.MEDIA, table_names)
test_database_helper_methods.setup = utils.open_test_db
test_database_helper_methods.teardown = utils.close_test_db

