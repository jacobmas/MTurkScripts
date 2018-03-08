
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
    var iter=0;
    var panel_primary=document.getElementsByClassName("panel-primary")[0];
    var panel_body=panel_primary.getElementsByClassName("panel-body")[0];
    panel_primary.removeChild(panel_body);
    panel_primary.removeChild(panel_primary.getElementsByClassName("panel-heading")[0]);
    panel_primary.style.padding="5px 10px 5px 10px";
    var flip_button = document.createElement("input");
    var no_flip_button = document.createElement("input");
    var true_label=document.createElement("label");
    var false_label=document.createElement("label");
    var column_label=document.createElement("label");
    var col_select=document.createElement("select");
    col_select.id="col_select";
    col_select.name="col_select";
    var temp_opt;
    for(i=0; i <= 4; i++)
    {
        temp_opt=document.createElement("option");
        temp_opt.value=i;
        temp_opt.innerHTML=i;
        if(i==0) temp_opt.selected=true;
        col_select.appendChild(temp_opt);
    }
    true_label.innerHTML="Flip";
    true_label.style.margin="2px 5px";
    false_label.innerHTML="Don't Flip";
    false_label.style.margin="2px 5px 2px 10px";
    column_label.innerHTML="Begin Col";
    column_label.style.margin="2px 10px 2px 10px";
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
    panel_primary.appendChild(column_label);
    panel_primary.appendChild(col_select);

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
         //   console.log("Found comma");
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
                    

            split_str=text.split(/\s+/);
         //    console.log("split_str.length="+split_str.length);
            if(split_str.length >= 3)
            {
                if(split_str[0].toLowerCase() in appell)
                {
                
                    fname=split_str[1].trim();
                    lname=split_str[2].trim();
                }
                else
                {
                  
                    fname=split_str[0].trim();
                    lname=split_str[1].trim();
                }
               // console.log("split_str[0]="+split_str[0]);
            }
            else
            {
             
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
        var i=0,j=0;
        var curr_line, second_part_line, second_arr;
        var has_pasted_title=false;
        var last_val=e.target.id.substr(e.target.id.length-1);
        if(split_lines===null)
            return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j].trim().length > 0)
                break;
        }
        if(split_lines.length>0 && j<split_lines.length&& split_lines[j].trim().length > 0)
        {
        //    console.log("Hello");
            name_paste_func(e,split_lines[j]);
        }
        for(i=j+1; i < split_lines.length; i++)
        {
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(":");
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            second_part_line=second_arr[second_arr.length-1].trim();
            if(validateEmail(second_part_line))
            {
                document.getElementById("email_"+last_val).value=second_part_line;
            }
            else if(validatePhone(second_part_line)
                     )
            {
                document.getElementById("phone_"+last_val).value=second_part_line;
            }
            else if(second_part_line.length>10 &&
                    second_part_line.substr(0,10)==="Phone Icon" && validatePhone(second_part_line.substr(11)))
            {
                document.getElementById("phone_"+last_val).value=second_part_line.substr(11);
            }
            else if(curr_line.trim().length>0 && curr_line.indexOf("Title:")===-1 && !has_pasted_title)
            {
                has_pasted_title=true;
                document.getElementById("title_"+last_val).value=curr_line.trim();
            }
        }

    };

    

    function column_paste_func(e)
    {
        e.preventDefault();
        var last_val=e.target.id.substr(e.target.id.length-1);
       // console.log("last_val="+last_val);
       
        var text = e.clipboardData.getData("text/plain");
        var split_lines=text.split("\n");
        var curr_no=0;
        var clip_str="";
        var temp_str="";
        var i,j;
        var max_line=split_lines.length<=8+1-last_val ? split_lines.length : 8+1-last_val;
        var y=parseInt(document.getElementById("col_select").value);
        console.log("y="+y);
        for(i=0; i < max_line; i++)
        {

            var tab_split=split_lines[i].split("\t");
            clip_str="";
            if(tab_split.length==1)
            {
                console.log("tab split=1");
                var temp_match=split_lines[i].match(/,/g);
                if(temp_match!==null && temp_match.length>1)
                {
                    tab_split=split_lines[i].split(",");
                }
                else
                {
                    temp_match=split_lines[i].match(/[·]/g);
                    if( temp_match!==null && temp_match.length>=1)
                    {

                        tab_split=split_lines[i].split("·");
                    }
                }
            }
            // console.log("tab_splitlen="+tab_split.length);
            var j_begin=y;
            if(tab_split.length>y+1 &&  tab_split[y+0].indexOf(" ")==-1)
            {
                j_begin=y+2;
                if(document.getElementById("flipped_true").checked)
                {
                    clip_str=tab_split[y+1]+" "+tab_split[y+0];
                }
                else {
                    clip_str=tab_split[y+0]+" "+tab_split[y+1];
                }
                if(tab_split.length>2+y) clip_str=clip_str+"\n";
            }
            for(j=j_begin; j < tab_split.length; j++)
            {

                clip_str=clip_str+tab_split[j];
               // if(j==0 && tab_split[j].indexOf(" ")==-1) { clip_str=clip_str+" "; }
                if(j<tab_split.length-1) { clip_str=clip_str+"\n"; }
            }
            //console.log(typeof last_val);
            var targ_obj=document.getElementById("fname_"+(curr_no+parseInt(last_val)).toString());
            var evt = new Event("myevent",{});

            evt.clipboardData=new DataTransfer();
            evt.clipboardData.setData("text/plain",clip_str);
            targ_obj.dispatchEvent(evt);
            data_paste_func(evt);
            if(split_lines[i].trim().length>0) curr_no++;
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