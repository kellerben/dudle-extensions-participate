#!/usr/bin/env ruby

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

require "webservices"

require "cgi"
$c = CGI.new
$header = {}

webservices = {}
all = []
Poll.methods.collect{|m|
	m.scan(/^webservicedescription_(.*)_(.*)$/)[0]
}.compact.each{|category,webservice|
	webservices[category] ||= []
	webservices[category] << webservice
	all << webservice
}

if all.include?($c["service"])
	$header = {"type" => "text/plain"}

	if $c.include?("pollID") && File.directory?("../../#{$c["pollID"]}/") && $c["pollID"] != ""

		Dir.chdir("../../#{$c["pollID"]}/")
		load "../dudle.rb"
		$d = Dudle.new

		$c.out($header){
			$d.table.send("webservice_#{$c["service"]}")
		}
	else
		$header["status"] = "404 Not Found"
		$c.out($header){"The requested poll was not found!"}
	end

else


$out = <<NOTICE
<h1>Available Polls</h1>
<table>
	<tr>
		<th>Poll</th><th>Last change</th>
	</tr>
NOTICE
Dir.glob("../../*/data.yaml").sort_by{|f|
	File.new(f).mtime
}.reverse.collect{|f| f.gsub(/\.\.\/\.\.\/(.*)\/data\.yaml$/,'\1') }.each{|site|
	$out += <<NOTICE
<tr>
	<td class='polls'><a href='?pollID=#{CGI.escapeHTML(site).gsub("'","%27")}'>#{CGI.escapeHTML(site)}</a></td>
	<td class='mtime'>#{File.new("../../#{site}/data.yaml").mtime.strftime('%d.%m, %H:%M')}</td>
	<td><a href='../../#{CGI.escapeHTML(site).gsub("'","%27")}'>go there</a></td>
	<td>
	<div>
		<form style='margin-bottom:0px' method='post' action='../../#{CGI.escapeHTML(site).gsub("'","%27")}/delete_poll.cgi'>
			<div>
				<input type='hidden' name='confirmnumber' value='0' />
				<input type='hidden' name='confirm' value='phahqu3Uib4neiRi' />
				<input type='submit' value='delete it!' />
			</div>
		</form>
		</div>
	</td>
</tr>
NOTICE
}

$out += "</table>"

webservices.sort.each{|category,ws|
	$out << "<h1>#{category}</h1>"
	ws.sort.each{|w|
		d = Poll.send("webservicedescription_#{category}_#{w}")
		$out << <<TITLE
<h2>#{w}(#{d["input"].to_a.join(", ")})</h2>
#{d['description']}
<form method='get' action=''>
<div>
<input type='hidden' name='service' value='#{w}' />
<table class='settingstable'>
<tr>
	<td><label for="#{w}pollID">pollID:</label></td>
	<td><input id="#{w}pollID" size='16' type='text' name='pollID' value='#{$c["pollID"]}' /></td>
</tr>
TITLE

		if d["input"]
			d["input"].each{|i| 
				$out << <<ROW
<tr>
	<td><label for="#{w}#{i}">#{i}:</label></td>
	<td><input id="#{w}#{i}" size='16' type='text' name='#{i}' /></td>
	<td class="shorttextcolumn">#{d[i]}</td>
</tr>
ROW
			}
		end
		$out << <<END
<tr>
	<td><strong>return:</strong></td>
	<td class="shorttextcolumn" colspan='2' style='width: 25em'>#{CGI.escapeHTML(d["return"])}</td>
</tr>
<tr>
	<td></td><td><input type='submit' value='#{Poll.instance_methods.include?("webservice_" + w) ? "Call" : "TODO' disabled='disabled"}' /></td>
</tr>
</table>
</div>
</form>
END
	}
}

$c.out($header){ 
	$out
}

end

