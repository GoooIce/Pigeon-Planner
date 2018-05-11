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
Interface for sending mails
"""


import urllib
import mimetypes

from pigeonplanner.core import const
from pigeonplanner.core import common


def send_email(recipient="", sender="", subject="", body="", attachment=None):
    files = []
    if attachment:
        files.append(("file", open(attachment, "rb")))

    fields = [("mail_to", recipient),
                ("mail_from", sender),
                ("subject", urllib.quote(subject)),
                ("comment", urllib.quote(body))
            ]

    post_multipart(const.MAILURL, fields, files)

def post_multipart(url, fields, files):
    content_type, body = encode_multipart_formdata(fields, files)
    headers = {"Content-type": content_type, "Content-length": str(len(body))}

    return common.URLOpen().open(url, body, headers, 40).read().strip()

def encode_multipart_formdata(fields, files):
    BOUNDARY = "----------%s" % common.get_random_number(20)
    body = []
    for (key, value) in fields:
        body.append("--" + BOUNDARY)
        body.append("Content-Disposition: form-data; name=\"%s\"" % key)
        body.append("")
        body.append(value)
    for (key, fd) in files:
        filename = fd.name.split("/")[-1]
        contenttype = (mimetypes.guess_type(filename)[0] or "application/octet-stream")
        body.append("--%s" % BOUNDARY)
        body.append("Content-Disposition: form-data; name=\"%s\"; filename=\"%s\""
                    %(key, filename))
        body.append("Content-Type: %s" % contenttype)
        fd.seek(0)
        body.append("\r\n" + fd.read())
    body.append("--" + BOUNDARY + "--")
    body.append("")

    return "multipart/form-data; boundary=%s" % BOUNDARY, "\r\n".join(body)

