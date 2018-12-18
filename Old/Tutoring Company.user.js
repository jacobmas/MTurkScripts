// ==UserScript==
// @name         Tutoring Company
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Makes Tutoring Company easier to parse
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include https://*amazonaws.com/*
// @include http://*amazonaws.com/*
// @grant        none
// ==/UserScript==



(function() {
    'use strict';
    var dataColl=document.getElementById("DataCollection");
    var panelPrimary=document.getElementsByClassName("panel-primary")[0];
    var workContent=document.getElementById("workContent");
    var instBody=document.getElementById("instructionBody");
    var panelHeading=document.getElementsByClassName("panel-heading")[0];
//   panelPrimary.removeChild(instBody);
    workContent.parentNode.removeChild(workContent);
    dataColl.appendChild(workContent);
  //  panelHeading.parentNode.removeChild(panelHeading);
   // panelPrimary.parentNode.removeChild(panelPrimary);
    var data_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var pos_array=["contact_name","contact_title","contact_email","web_url"];
        var i;
        for(i=0; i < 4; i++)
        {
            if(split_str.length>i)
            {
                var curr_inp=document.getElementById(pos_array[i]);
                curr_inp.value=split_str[i];
            }
        }

    };
    var cont_name=document.getElementById("contact_name");
    contact_name.addEventListener("paste",data_paste_func);
    var button = document.createElement("input");
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
    };

})();