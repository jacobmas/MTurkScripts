// ==UserScript==
// @name         KimberlyScript2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Kirk Deming and Kimberly
// @author       You
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    var i;
    var the_lab;
    var the_well;
    var webData = document.getElementById("WebsiteDataCollection");
    var rows = webData.getElementsByClassName("well");
    console.log("rows="+rows);

    var panelPrimary=document.getElementsByClassName("panel-primary")[0];
    panelPrimary.parentNode.removeChild(panelPrimary);
    var my_p=document.createElement("p");
    my_p.className="text-center";
    var button = document.createElement("input");
    button.id="nabutton";
    button.type="button";
    button.value="Fill NA";
    button.style.margin='5px';
    button.style.marginRight='20px';
    var button_top=button.cloneNode();
    button_top.id="nabuttontop";
    var sub_button = document.getElementById('submitButton').cloneNode();
    sub_button.id="submitButtonTop";

    my_p.insertAdjacentElement('beforeend',button_top);
        my_p.insertAdjacentElement('beforeend',sub_button);
    document.getElementById('submitButton').insertAdjacentElement('beforebegin',button);
    rows[0].insertAdjacentElement('afterend',my_p);

    var the_inputs=document.getElementsByClassName('form-control');
    var j;
    for(j=0 ; j < the_inputs.length; j++)
    {
        the_inputs[j].value="";
        the_inputs[j].type="text";
        the_inputs[j].placeholder="";
        if(j===the_inputs.length-1)
        {
            the_inputs[j].value="no";
        }
        if(the_inputs[j].name.indexOf("count")!==-1 || the_inputs[j].name.indexOf("Count")!==-1)
        {
            var bob=function(e) {
                e.preventDefault();
                console.log("e.target="+e.target.name);
                var text = e.clipboardData.getData("text/plain");
                var split_str=text.split("\n");
                var my_re=/\d+/;
                var matches=text.match(my_re);
                console.log("text="+text);
                console.log("matches="+JSON.stringify(matches));
                if(matches!==null && matches.length>0)
                {
                    e.target.value=matches[0];
                }
            };
            the_inputs[j].addEventListener("paste", bob,false);
        }
        else if(the_inputs[j].name.indexOf("brand")!==-1 || the_inputs[j].name.indexOf("Brand")!==-1)
        {
            var fred=function(e) {
                e.preventDefault();
                console.log("e.target="+e.target.name);
                var text = e.clipboardData.getData("text/plain");
                var split_str=text.split("\n");
                var my_re=/\(?\d+\)?$/;
                var matches=text.match(my_re);
                console.log("text="+text);
                console.log("matches="+JSON.stringify(matches));
                if(matches!==null && matches.length>0)
                {
                    e.target.value=text.substr(0,text.indexOf(matches[0]));
                }
                else
                    e.target.value=text;
            };
            the_inputs[j].addEventListener("paste", fred,false);
        }
       else
        {
            console.log("Name: "+the_inputs[j].name);
        }

    }
    var pasteAll=function(e) {
        e.preventDefault();
        var the_inputs=document.getElementsByClassName('form-control');

        var text = e.clipboardData.getData("text/plain");
        var split_strs=text.split("\n");
        var my_re=/ ?\(?(\d+)\)?$/;
        var i, curr_str;
        var i_len= split_strs.length<6 ? split_strs.length : 6;
        for(i=0; i < i_len; i++)
        {
            curr_str=split_strs[i].trim();
            var match_result=my_re.exec(curr_str);
            if(match_result !== null && match_result.length>=2)
            {
                the_inputs[2*i+1].value=match_result[1];
                the_inputs[2*i+2].value=curr_str.substr(0,match_result.index);
            }
        }
    };
    the_inputs[1].addEventListener("paste",pasteAll);
    var my_func = function()
    {
        for(var i=0; i < the_inputs.length; i++)
        {
            //        console.log("the_inputs[\""+curr_var+"\"]="+the_inputs[curr_var]);
            if(the_inputs[i].value==="")
            {
               the_inputs[i].value="NA";
            }
        }
    };
    button.onclick=function() { my_func(); };
    button_top.onclick=function() { my_func(); };
   /* window.addEventListener("keydown",function(e) {
        if(e.key !== "n") {
            return;
          }
        //console.log("MOO");
        my_func();
    }); */

})();