// ==UserScript==
// @name         KVeltriPlus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Karen Veltri tasks by allowing efficient copy/paste from Linkedin with Linkedinscript
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include file://*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    var check_validity = function() {
        if(document.getElementById("current_title").value === 'undefined') return false;
        for(var i=1; i <= 3; i++) {
            if(document.getElementById("previous_title_"+i).value === 'undefined') return false;
        }
        return true;
    };
    var url_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var my_re=/\d{4}/;
        var curr_pos=0;
        var temp_re;
        if(split_str.length>=1)
        {
            document.getElementById("web_url").value=split_str[0];
        }
        if(split_str.length>=5) {
            document.getElementById("current_firm").value=split_str[2].substr(12);
            document.getElementById("current_title").value=split_str[1];
            temp_re=my_re.exec(split_str[3]);
            if(temp_re!==null && temp_re.length>0)
                document.getElementById("current_year").value=temp_re[0];
        }
        for(curr_pos=1; (curr_pos+1)*4+1 <= split_str.length && curr_pos <= 3; curr_pos++)
        {
            document.getElementById("previous_co_"+curr_pos).value=split_str[curr_pos*4+2].substr(12);
            document.getElementById("previous_title_"+curr_pos).value=split_str[curr_pos*4+1];
            temp_re=my_re.exec(split_str[curr_pos*4+3]);
            if(temp_re.length>0)
            {
                document.getElementById("previous_year_"+curr_pos).value=temp_re[0];
            }
        }
        if(curr_pos*4 < split_str.length)
        {
        }
    };
    var current_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var my_re=/\d{4}/;
        document.getElementById("current_firm").value=split_str[0];
        document.getElementById("current_title").value=split_str[1];
        document.getElementById("current_year").value=(my_re.exec(split_str[3]))[0];
    };
    var prev_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var last_val=this.id.substr(this.id.length-1);
        console.log("last_val="+last_val);
        var my_re=/\d{4}/;
        document.getElementById("previous_co_"+last_val).value=split_str[0];
        document.getElementById("previous_title_"+last_val).value=split_str[1];
        document.getElementById("previous_year_"+last_val).value=(my_re.exec(split_str[3]))[0];
    };

    var find_graduation=function(str_list) {
        var i;
        var my_re2=/\d{4}/g;
        var grad_year_list;
        var grad_year = -1;
        for(i=0; i < str_list.length; i++) {
            if(str_list[i].indexOf("Dates attended or expected graduation") === 0)
            {
                grad_year_list=str_list[i].match(my_re2);
                if(grad_year_list.length>0) {
                    grad_year=grad_year_list[grad_year_list.length-1];
                }
                break;
            }
        }
        if(grad_year=== -1) { return ""; }
        return grad_year;
    };

    var law_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var last_val=this.id.substr(this.id.length-1);
       // console.log("last_val="+last_val);
        var my_re=/\d{4}/;
        var my_re2=/\d{4}/g;
        var arr_pos = split_str.length -1;
         var grad_year;
      /*   while(arr_pos >= 0)
         {
             grad_year=split_str[arr_pos].match(my_re2);
             if(!(grad_year === null || grad_year.length>2))
             {
                 break;
             }
             arr_pos-=1;
         } */


        document.getElementById("law_school").value=split_str[0];
        document.getElementById("graduation_year").value=find_graduation(split_str);

           // grad_year[grad_year.length-1];

    };
     var undergrad_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        var last_val=this.id.substr(this.id.length-1);
        console.log("last_val="+last_val);
        var my_re=/\d{4}/;
         var my_re2=/\d{4}/g;
        var arr_pos = split_str.length -1;
         var grad_year;
      /*   while(arr_pos >= 0)
         {
             grad_year=split_str[arr_pos].match(my_re2);
             if(!(grad_year === null || grad_year.length>2))
             {
                 break;
             }
             arr_pos-=1;
         } */

        document.getElementById("undergrad_school").value=split_str[0];
        document.getElementById("undergrad_graduation_year").value=find_graduation(split_str);

    };
    /* Education paste to make it a bit quicker */
    var ed_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.split("\n");
        if(split_str.length>=4)
        {
            document.getElementById("law_school").value=split_str[0];
            document.getElementById("graduation_year").value=split_str[1];
            document.getElementById("undergrad_school").value=split_str[2];
            document.getElementById("undergrad_graduation_year").value=split_str[3];
        }

    };
    document.getElementById("web_url").addEventListener("paste",url_paste_func);
    document.getElementById("current_firm").addEventListener("paste",current_paste_func);
    var i;
    for(i=1; i<=3; i++) {
        document.getElementById("previous_co_"+i).addEventListener("paste",prev_paste_func);
    }
    document.getElementById("law_school").addEventListener("paste",law_paste_func);
    /* paste other side for this */
    document.getElementById("graduation_year").addEventListener("paste",ed_paste_func);

    document.getElementById("undergrad_school").addEventListener("paste",undergrad_paste_func);
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
    document.getElementById("mturk_form").onsubmit=function() { return check_validity(); };

    /* Fix the table to allow easier copying */
    var workContent=document.getElementById("workContent");
    var workTable =workContent.getElementsByTagName("table")[0];
    var lawyer_name=workTable.rows[1].cells[1].innerText;
    var split_law=lawyer_name.split(" ");
    var suffixes={"Jr":0,"II":0,"III":0,"IV":0};
    var new_lawyer_name="";
    var last_pos=split_law.length-1;
    if(split_law.length >= 2) {
        if(split_law[last_pos] in suffixes && last_pos>=2) { last_pos-=last_pos-1; }
        new_lawyer_name=split_law[0]+" "+split_law[last_pos];
    }
    else
    {
        new_lawyer_name = lawyer_name;
    }
    GM_setClipboard(new_lawyer_name,"text");


})();