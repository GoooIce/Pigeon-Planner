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


class BaseSchema(object):
    # Override these values
    # VERSION should be an int indicating the schema version
    VERSION = None
    # SCHEMA should be a dict with a list of tuples
    # { table_name: [ (column_name, data_type, constraints) ] }
    SCHEMA = None

    @classmethod
    def migrate(cls, session):
        raise NotImplementedError

    @classmethod
    def create_new(cls, session):
        raise NotImplementedError

    @classmethod
    def get_table_names(cls):
        return cls.SCHEMA.keys()

    @classmethod
    def get_column_names(cls, table):
        return [col[0] for col in cls.SCHEMA[table]]

    @classmethod
    def get_column_sql(cls, table, name):
        for col in cls.SCHEMA[table]:
            if name == col[0]:
                coldefs = col
                break
        return ", ".join(coldefs)

    @classmethod
    def get_columns_sql(cls, table):
        data = []
        for column_data in cls.SCHEMA[table]:
            data.append(" ".join(column_data))
        return ", ".join(data)

