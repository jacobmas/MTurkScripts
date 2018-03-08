
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
    var panel_body=panel_primary.getElementsByClassName("panel-body")[0];
    panel_primary.removeChild(panel_body);
    panel_primary.removeChild(panel_primary.getElementsByClassName("panel-heading")[0]);
    panel_primary.style.padding="5px 10px 5px 10px";
    var flip_button = document.createElement("input");
    var no_flip_button = document.createElement("input");
    var true_label=document.createElement("label");
    var false_label=document.createElement("label");
    true_label.innerHTML="Flip";
    true_label.style.margin="2px 5px";
    false_label.innerHTML="Don't Flip";
    false_label.style.margin="2px 5px 2px 10px";
    flip_button.style.margin="2px 5px";
    flip_button.setAttribute("type","radio");
    flip_button.setAttribute("name","is_flipped");
    flip_button.setAttribute("id","flipped_true");
    flip_button.setAttribute("value","true");
    flip_button.checked=true;
    no_flip_button.style.margin="2px 5px";
    no_flip_button.setAttribute("type","radio");
    no_flip_button.setAttribute("name","is_flipped");
    no_flip_button.setAttribute("id","flipped_false");
    no_flip_button.setAttribute("value","false");
    panel_primary.appendChild(flip_button);
    panel_primary.insertBefore(true_label,flip_button);
    panel_primary.appendChild(false_label);
    panel_primary.appendChild(no_flip_button);

    var url=document.getElementById("url");
    url.required=true;

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    function validatePhone(phone) {
        var re=/[A-Za-z\-\(\)\./]*/g;
        var new_str=phone.replace(re,"");
       // console.log(new_str);
        var new_re=/^\d{3,11}/;
       // console.log(new_re.test(new_str.substr(0,10)));
        return new_re.test(new_str);
    }

    var name_paste_func=function(e,text) {
        // cancel paste
        var split_str,fname,lname;
        var appell={"mr.":0,"mrs.":0,"ms.":0,"miss":0,"dr.":0};
        if(text.indexOf(",") !== -1)
        {
            console.log("Found comma");
            split_str=text.split(/,\s*/);
            if(split_str.length >= 3 && split_str[0].toLowerCase() in appell) {
                fname=split_str[1].trim();
                lname=split_str[2].trim();
            }
            else
            {

                if(split_str.length > 0) lname=split_str[0].trim();
                if(split_str.length > 1) fname=split_str[1].trim();
            }
        }
        else {
                       console.log("Found no comma");

            split_str=text.split(/\s+/);
         //    console.log("split_str.length="+split_str.length);
            if(split_str.length >= 3)
            {
                if(split_str[0].toLowerCase() in appell)
                {
                    console.log("MOO");
                    fname=split_str[1].trim();
                    lname=split_str[2].trim();
                }
                else
                {
                    console.log("SHROO");
                    fname=split_str[0].trim();
                    lname=split_str[1].trim();
                }
               // console.log("split_str[0]="+split_str[0]);
            }
            else
            {
                console.log("TOO, "+split_str.length);
                if(split_str.length > 0) fname=split_str[0].trim();
                if(split_str.length > 1) lname=split_str[1].trim();
            }
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
        var curr_line, second_part_line, second_arr;
        var has_pasted_title=false;
        var last_val=e.target.id.substr(e.target.id.length-1);
        if(split_lines.length>0 && split_lines[0].trim().length > 0)
        {
        //    console.log("Hello");
            name_paste_func(e,split_lines[0]);
        }
        for(i=1; i < split_lines.length; i++)
        {
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(":");
            console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            second_part_line=second_arr[second_arr.length-1].trim();
            if(validateEmail(second_part_line))
            {
                document.getElementById("email_"+last_val).value=second_part_line;
            }
            else if(validatePhone(second_part_line))
            {
                document.getElementById("phone_"+last_val).value=second_part_line;
            }
            else if(curr_line.length>0 && !has_pasted_title)
            {
                has_pasted_title=true;
                document.getElementById("title_"+last_val).value=curr_line;
            }
        }

    };

    

    function column_paste_func(e)
    {
        e.preventDefault();
        var last_val=e.target.id.substr(e.target.id.length-1);
        console.log("last_val="+last_val);
       
        var text = e.clipboardData.getData("text/plain");
        var split_lines=text.split("\n");
        var clip_str="";
        var temp_str="";
        var i,j;
        var max_line=split_lines.length<=8+1-last_val ? split_lines.length : 8+1-last_val;
        for(i=0; i < max_line; i++)
        {
            var tab_split=split_lines[i].split("\t");
            clip_str="";
            // console.log("tab_splitlen="+tab_split.length);
            var j_begin=0;
            if(tab_split.length>1 &&  tab_split[0].indexOf(" ")==-1)
            {
                j_begin=2;
                if(document.getElementById("flipped_true").checked)
                {
                    clip_str=tab_split[1]+" "+tab_split[0];
                }
                else {
                    clip_str=tab_split[0]+" "+tab_split[1];
                }
                if(tab_split.length>2) clip_str=clip_str+"\n";
            }
            for(j=j_begin; j < tab_split.length; j++)
            {

                clip_str=clip_str+tab_split[j];
               // if(j==0 && tab_split[j].indexOf(" ")==-1) { clip_str=clip_str+" "; }
                if(j<tab_split.length-1) { clip_str=clip_str+"\n"; }
            }
            //console.log(typeof last_val);
            var targ_obj=document.getElementById("fname_"+(i+parseInt(last_val)).toString());
            var evt = new Event("myevent",{});

            evt.clipboardData=new DataTransfer();
            evt.clipboardData.setData("text/plain",clip_str);
            targ_obj.dispatchEvent(evt);
            data_paste_func(evt);
        }

       
    }

    var i;
    for(i=1; i<=8; i++) {
  //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
        if(document.getElementById("fname_"+i) !== null)
        {
            document.getElementById("lname_"+i).addEventListener("paste",data_paste_func);
            document.getElementById("fname_"+i).addEventListener("paste", function(e) {
                //console.log("window.clipboardData="+window.clipboardData);
                column_paste_func(e); } );
        }

    }


})();