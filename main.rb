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


class Extension
	def initialize(basedir)
		@basedir = basedir + "/extensions/participate"
#FIXME remove?		$d.html.add_script("var gsDCExtensiondir='#{@basedir}/';")

#     if File.exists?("#{@basedir}/locale/#{GetText.locale.language}/dudle_dc-net.po")
#       $d.html.add_html_head("<link rel='gettext' type='application/x-po' href='#{$d.html.relative_dir}#{@basedir}/locale/#{GetText.locale.language}/dudle_dc-net.po' />")
#     end
		add_lib("Gettext")
#     $d.html.add_head_script("#{@basedir}/lib/prototype.js")
		
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
		$d.html.add_script("Poll.ID = '#{$d.urlsuffix}';")
else
	e = Extension.new(".")
e.add_script("common")
end
e.add_lib("jquery")
e.add_lib("json2")

$d.html.add_script(<<SCRIPT
Poll.Strings = {};
Poll.Strings.Edit = '#{EDIT}';
Poll.Strings.Delete = '#{DELETE}';
Poll.Strings.Unknown = '#{UNKNOWN}';
Poll.Strings.KickOut = '#{DELETE}';
Poll.Strings.Voted = '#{PASSWORDSTAR}';
Poll.Strings.yes = '#{YES}';
Poll.Strings.maybe = '#{MAYBE}';
Poll.Strings.no = '#{NO}';
Poll.Strings.yesval = 'ayes';
Poll.Strings.maybeval = 'bmaybe';
Poll.Strings.noval = 'cno';
Poll.extDir = '../extensions/participate';
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
