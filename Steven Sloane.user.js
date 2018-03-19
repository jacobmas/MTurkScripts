// ==UserScript==
// @name         Steven Sloane
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Steven Sloane tasks by allowing efficient copy/paste from Linkedin with Linkedinscript
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include file://*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    var panel_prim=document.getElementsByClassName("panel-primary")[0];
    panel_prim.parentNode.removeChild(panel_prim);

    var exp_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        var max_exp_len=10;
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var my_re=/\d{4}/g;
        var curr_pos=0;
        var temp_arr;
        for(curr_pos=0; (curr_pos)*4 <= split_str.length && curr_pos < max_exp_len; curr_pos++)
        {
            console.log("c"+toString(curr_pos+1));

            document.getElementsByName("c"+(curr_pos+1).toString())[0].value=split_str[curr_pos*4+1].substr(12);
            document.getElementsByName("p"+(curr_pos+1).toString())[0].value=split_str[curr_pos*4];
            temp_arr=split_str[curr_pos*4+2].match(my_re);
            if(temp_arr !== null && temp_arr.length>0)
            {
                document.getElementsByName("s"+(curr_pos+1).toString())[0].value=temp_arr[0];
            }
            if(temp_arr!== null && temp_arr.length>1)
            {
                document.getElementsByName("e"+(curr_pos+1).toString())[0].value=temp_arr[1];

            }
            else if(split_str[curr_pos*4+2].indexOf("Present")!==-1)
            {
                document.getElementsByName("e"+(curr_pos+1).toString())[0].value="Present";
            }
        }

    };

    document.getElementsByName("p1")[0].addEventListener("paste",exp_paste_func);
  
 /*   var button = document.createElement("input");
    button.type="button";
    button.value="Fill N/A";
    var sub_button = document.getElementById('submitButton');
    button.style.margin='5px';
    button.style.marginRight='20px';
    sub_button.insertAdjacentElement('beforebegin',button);
    var the_inputs=document.getElementsByClassName('form-control');
    button.onclick = function()
    {
        for(var i=0; i < the_inputs.length; i++)
        {
            //        console.log("the_inputs[\""+curr_var+"\"]="+the_inputs[curr_var]);
            if(the_inputs[i].value==="")
            {
                if(the_inputs[i].id != "web_url")
                    the_inputs[i].value="N/A";
                else
                    the_inputs[i].value="http://NA.com";
            }
        }
    };*/
//    document.getElementById("mturk_form").onsubmit=function() { return check_validity(); };

    /* Fix the table to allow easier copying */
    var well1=document.getElementsByClassName("well")[0];
    
    GM_setClipboard(well1.innerText.substr(5),"text");


})();