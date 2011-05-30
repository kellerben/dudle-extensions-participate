############################################################################
# Copyright 2009, 2010 Benjamin Kellermann                                 #
#                                                                          #
# This file is part of dudle.                                              #
#                                                                          #
# Dudle is free software: you can redistribute it and/or modify it under   #
# the terms of the GNU Affero General Public License as published by       #
# the Free Software Foundation, either version 3 of the License, or        #
# (at your option) any later version.                                      #
#                                                                          #
# Dudle is distributed in the hope that it will be useful, but WITHOUT ANY #
# WARRANTY; without even the implied warranty of MERCHANTABILITY or        #
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     #
# License for more details.                                                #
#                                                                          #
# You should have received a copy of the GNU Affero General Public License #
# along with dudle.  If not, see <http://www.gnu.org/licenses/>.           #
############################################################################

def _(a)
	a
end

require "pp"
olddir = Dir.pwd
Dir.chdir("../../")
require "config_defaults"
Dir.chdir(olddir)

require "cgistatus"
require "json"
require "time"

class Poll
	def Poll.webservicedescription_1Polldetails_getColumns
		{ "return" => "Liste der Spalten" }
	end
	def webservice_getColumns
		@head.columns.to_json
	end

	def Poll.webservicedescription_2Pollmodification_store
		{ "return" => '"HTTP202 OR HTTP403"',
			"input" => ["extID", "key", "value", "read_passwd", "write_passwd_old", "write_passwd_new"],
			"extID" => "some Identifier, for the extension",
			"read_passwd" => "password to read (optional)",
			"write_passwd_old" => "old password to write (optional)",
			"write_passwd_new" => "new password to write (optional)",
#       "value" => "json string"
		}
	end
	def webservice_store
		@extensiondata ||= {}
		@extensiondata[$cgi["extID"]] ||= {}
		@extensiondata[$cgi["extID"]][$cgi["key"]] ||= {}
 

		if !@extensiondata[$cgi["extID"]][$cgi["key"]][:write_pw] || @extensiondata[$cgi["extID"]][$cgi["key"]][:write_pw] == $cgi["write_passwd_old"]
			@extensiondata[$cgi["extID"]][$cgi["key"]][:val] = $cgi["value"]
			@extensiondata[$cgi["extID"]][$cgi["key"]][:write_pw] = $cgi["write_passwd_new"]
			@extensiondata[$cgi["extID"]][$cgi["key"]][:read_pw] = $cgi["read_passwd"]
			@extensiondata[$cgi["extID"]][$cgi["key"]][:time] = Time.now
			store "Added data for #{$cgi["extID"]}"
		else
			$header["status"] = CGI::HTTP_STATUS[403]
			"You are not allowed to store this!"
		end
	end
	def Poll.webservicedescription_2Pollmodification_load
		{ "return" => '"data OR HTTP404 OR HTTP403. If type==json, then data := {time:stored_time, data:data}"',
			"input" => ["extID", "key", "type", "read_passwd"],
			"read_passwd" => "Optional: password to read",
			"type" => "Optional: plain (default) or json",
			"extID" => "some Identifier, for the extension",
#       "value" => "json string"
		}
	end
	def webservice_load
		@extensiondata ||= {}
		unless @extensiondata[$cgi["extID"]]
			error = "Did not found the extID '#{$cgi['extID']}'" 
		else
			unless @extensiondata[$cgi["extID"]][$cgi["key"]]
				error = "Did not found the key '#{$cgi['key']}'" 
			end
		end
		if error
			$header["status"] = CGI::HTTP_STATUS[404]
			error
		else
			if @extensiondata[$cgi["extID"]][$cgi["key"]][:read_pw] == $cgi["read_passwd"]
				if $cgi["type"] == "json"
					{:time => @extensiondata[$cgi["extID"]][$cgi["key"]][:time].rfc2822, :data => @extensiondata[$cgi["extID"]][$cgi["key"]][:val]}.to_json
				else
					@extensiondata[$cgi["extID"]][$cgi["key"]][:val]
				end
			else
				$header["status"] = CGI::HTTP_STATUS[403]
				"You are not allowed to read this!"
			end
		end
	end
end



