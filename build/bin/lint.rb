#!/usr/bin/env ruby
FILENAME = ENV['TM_FILENAME']
FILEPATH = ENV['TM_FILEPATH']
FILEDIR  = `dirname #{FILEPATH}`.strip!
SUPPORT  = ENV['TM_BUNDLE_SUPPORT']
ARCH     = `uname -p`.strip!
BINARY   = "#{SUPPORT}/bin/#{ARCH}/jsl"

CONF_FILES= [ "#{SUPPORT}/conf/jsl.conf",
              "#{ENV['HOME']}/.jsl.conf",
              "#{ENV['TM_PROJECT_DIRECTORY']}/jsl.conf",
              "#{FILEDIR}/jsl.conf"
            ]

CONF_FILES.delete_if { |file| !FileTest.exists?(file) }
            
CONF = CONF_FILES.last

output = `"#{BINARY}" -process "#{FILEPATH}" -nologo -conf "#{CONF}"`

output.gsub!('lint warning:', '<span class="warning">Warning:</span>')
output.gsub!('SyntaxError:', '<span class="error">Syntax Error:</span>')
output.gsub!('Error:', '<span class="error">Error:</span>')
output.gsub!('Failed:', '<span class="error">Failed</span>')
output.gsub!( /^#{FILENAME}$/, '')

output  = output.split(/\n/)
# the "X error(s), Y warning(s)" line will always be at the end
results = output.pop
len= output.length
messages= []
i=0
url= ""

while i < len
  line= output[i]
  match= line.match(/(.*?([^\/]*)):(\d+):(.*)/)
  if match
    column=nil
    if output[i+2]
      column= output[i+2].rindex("^")
    end
    url= "txmt://open?url=file://#{match[1]}&amp;line=#{match[3]}"
    
    if column
      url = url + "&amp;#{column+1}"
    end

    msg= "<li><a href=\"#{url}\">#{match[2]}:#{match[3]}</a>: #{match[4]}"
    if column
      msg = msg + "<pre><code>#{output[i+1]}\n#{output[i+2]}</pre></code>"
      i= i+2
    end
  
    msg = msg + '</li>'
    messages.push(msg)
  end
  
  i= i+1
end

html = <<WTF
<html>
  <head>
    <title>JavaScript Lint Results: #{FILENAME}</title>
    <style type="text/css">
      body {
        font-size: 13px;
      }
      
      pre {
        background-color: #eee;
        color: #400;
        margin: 3px 0;
      }
      
      code {
        font-family: monaco;
        font-size: 12px;
      }
      
      h1, h2 { margin: 0 0 5px; }
      
      h1 { font-size: 20px; }
      h2 { font-size: 16px;}
      
      span.warning {
        color: #c90;
        text-transform: uppercase;
        font-weight: bold;
      }
      
      span.error {
        color: #900;
        text-transform: uppercase;
        font-weight: bold;
      }
      
      ul {
        margin: 10px 0 0 20px;
        padding: 0;
        list-style: none;
      }
      
      li {
        margin: 0 0 10px;
      }
    </style>
  </head>
  <body>
    <h1>#{FILENAME}</h1>
    <h2>#{results}</h2>
    
    <ul>
      #{messages.join("\n")}
    </ul>
  </body>
</html>  
WTF

puts html