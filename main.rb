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
	def initialize
		@basedir = $d.is_poll? ? ".." : "."
		@basedir += "/extensions/#{$current_ext_dir}"
		if GetText.locale.language =~ /^[a-zA-Z_]+$/
			pofile = "#{@basedir}/locale/#{GetText.locale.language}/dudle.po"
			if File.exists?(pofile)
				$d.html.add_html_head("<link rel='gettext' type='application/x-po' href='#{pofile}' />")
			end
		end

		if File.exists?("#{@basedir}/common.js")
			add_script("common")
		end

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
	def add_script_if_exists(script)
		add_script(script) if File.exists?("#{@basedir}/#{script}.js")
	end
	def load_js
		if $d.tab == "."
			if $d.is_poll?
				add_script_if_exists("participate")
			else
				add_script_if_exists("index")
			end
		else
			add_script_if_exists($d.tab.gsub(/\.cgi$/,""))
		end
	end
end

e = Extension.new
e.add_lib("jquery-2.2.3.min")
e.add_lib("json2")
e.add_lib("Gettext")

locale = GetText.locale.to_s.gsub("_","-")
locale = "#{locale}-#{locale.upcase}" if locale =~ /^..$/
datelib = "datejs/date-#{locale}"
if File.exists?("#{e.basedir}/lib/#{datelib}.js")
	e.add_lib(datelib)
else
	locale.gsub!(/-../,"")
	try = Dir.new("#{e.basedir}/lib/datejs").to_a.collect{|f|
		f =~ /date-#{locale}-..\.js/ ? f : nil
	}.compact.first
	if try
		e.add_lib("datejs/#{try.gsub(/\.js$/,"")}")
	else
		e.add_lib("datejs/date")
	end
end


$d.html.add_html_head(<<CSS
<style type="text/css">
<!--
.headerSort:after {
	content: "#{SORT}";
}
.headerSortReverse:after {
	content: "#{REVERSESORT}";
}
[class=header]:after {
	content: "#{NOSORT}";
}
-->
</style>
CSS
)

$d.html.add_script(<<SCRIPT
Poll.Strings.SortDown = '#{SORT}';
Poll.Strings.SortUp = '#{REVERSESORT}';
Poll.Strings.NoSort = '#{NOSORT}';
Poll.Strings.Edit = '#{EDIT}';
Poll.Strings.Delete = '#{DELETE}';
Poll.Strings.Unknown = '#{UNKNOWN}';
Poll.Strings.KickOut = '#{DELETE}';
Poll.Strings.Voted = '#{PASSWORDSTAR}';
Poll.extDir = '#{e.basedir}';
SCRIPT
)

if $d.is_poll?
		$d.html.add_script(<<POLLSPECIFIC
Poll.ID = '#{$d.urlsuffix}';
Poll.columns = #{$d.table.head.columns.to_json};
Poll.Strings.yes   = {symb: '#{YES}',   val: '#{Poll::YESVAL}'};
Poll.Strings.maybe = {symb: '#{MAYBE}', val: '#{Poll::MAYBEVAL}'};
Poll.Strings.no    = {symb: '#{NO}',    val: '#{Poll::NOVAL}'};
Poll.Strings.vals = ["yes", "maybe", "no"];
$.each(Poll.Strings.vals, function(i, elem) {
	Poll.Strings[Poll.Strings[elem].val] = elem;
	Poll.Strings[elem].parsedSymb = $("<td>" + Poll.Strings[elem].symb + "</td>").text();
});
POLLSPECIFIC
			)
end
e.load_js
