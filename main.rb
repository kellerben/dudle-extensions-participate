############################################################################
# Copyright 2009,2010,2011 Benjamin Kellermann                             #
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

require "json"

class Extension
	attr_reader :basedir
	def initialize(basedir)
		@basedir = basedir + "/extensions/#{$current_ext_dir}"
		pofile = "#{@basedir}/locale/#{GetText.locale.language}/dudle.po"
		if File.exists?(pofile)
			$d.html.add_html_head("<link rel='gettext' type='application/x-po' href='#{pofile}' />")
		end
		add_lib("Gettext")
		
	end
	def add_lib(jslib)
		$d.html.add_head_script("#{@basedir}/lib/#{jslib}.js")
	end
	def add_script(script)
		$d.html.add_script_file("#{@basedir}/#{script}.js")
	end
	def add_css(file)
		$d.html.add_css("#{@basedir}/#{file}.css")
	end
end


if $d.is_poll?
		e = Extension.new("..")
		e.add_script("common")
		$d.html.add_script(<<POLLSPECIFIC
Poll.ID = '#{$d.urlsuffix}';
Poll.columns = #{$d.table.head.columns.to_json};
Poll.Strings.yes   = {symb: '#{YES}',   val: '#{Poll::YESVAL}'};
Poll.Strings.maybe = {symb: '#{MAYBE}', val: '#{Poll::MAYBEVAL}'};
Poll.Strings.no    = {symb: '#{NO}',    val: '#{Poll::NOVAL}'};
Poll.Strings.vals = ["yes", "maybe", "no"];
for	(var i = 0; i < Poll.Strings.vals.length; i++) {
	Poll.Strings[Poll.Strings[Poll.Strings.vals[i]].val] = Poll.Strings.vals[i];
}
POLLSPECIFIC
			)
else
	e = Extension.new(".")
e.add_script("common")
end
e.add_lib("jquery-1.5.2.min")
e.add_lib("json2")

$d.html.add_script(<<SCRIPT
Poll.Strings.Edit = '#{EDIT}';
Poll.Strings.Delete = '#{DELETE}';
Poll.Strings.Unknown = '#{UNKNOWN}';
Poll.Strings.KickOut = '#{DELETE}';
Poll.Strings.Voted = '#{PASSWORDSTAR}';
Poll.extDir = '#{e.basedir}';
SCRIPT
)

if $d.is_poll?
		e = Extension.new("..")
		$d.html.add_script("Poll.ID = '#{$d.urlsuffix}';")

		case $d.tab
		when "." 
			e.add_script("participate")
		end
else
	e = Extension.new(".")
end
