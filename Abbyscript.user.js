
// ==UserScript==
// @name         Abbyscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Abby
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var panel_primary=document.getElementsByClassName("panel-primary")[0];
    panel_primary.parentNode.removeChild(panel_primary);

    var url=document.getElementById("url");
    url.required=true;

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    function validatePhone(phone) {
        var re=/[A-Za-z\-\(\)]*/g;
        var new_str=phone.replace(re,"");
        var new_re=/^[\d]{10-11}/;
        return new_re.test(new_str);
    }

    var name_paste_func=function(e,text) {
        // cancel paste
        var split_str,fname,lname;
        if(text.indexOf(",") !== -1)
        {
            //console.log("Found comma");
            split_str=text.split(/,\s*/);
            if(split_str.length > 0) lname=split_str[0];
            if(split_str.length > 1) fname=split_str[1];
        }
        else {
                        //console.log("Found no comma");

            split_str=text.split(/\s+/);
            if(split_str.length > 0) fname=split_str[0];
            if(split_str.length > 1) lname=split_str[1];
        }
        var last_val=e.target.id.substr(e.target.id.length-1);
        document.getElementById("fname_"+last_val).value=fname;
        document.getElementById("lname_"+last_val).value=lname;

    };
    var data_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_lines=text.split("\n");
        var fname="",lname="";
        var i=1;
        var curr_line;
        var last_val=e.target.id.substr(e.target.id.length-1);
        if(split_lines.length>0)
        {
            name_paste_func(e,split_lines[0]);
        }
        for(i=1; i < split_lines.length; i++)
        {
            curr_line=split_lines[i].trim();
            if(validateEmail(curr_line))
            {
                document.getElementById("email_"+last_val).value=curr_line;
            }
            else if(validatePhone(curr_line))
            {
                document.getElementById("phone_"+last_val).value=curr_line;
            }
            else
            {
                document.getElementById("title_"+last_val).value=curr_line;
            }
        }

    };

    var i;
    for(i=1; i<=8; i++) {
  //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
        if(document.getElementById("fname_"+i) !== null)
        {
            document.getElementById("fname_"+i).addEventListener("paste",data_paste_func);
        }

    }


})();