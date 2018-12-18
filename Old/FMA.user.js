// ==UserScript==
// @name         FMA
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Karen Veltri tasks by allowing efficient copy/paste from Linkedin with Linkedinscript
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include        http://*.zillow.com/*
// @include        https://*.zillow.com/*
// @grant        GM_setClipboard
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_openInTab
// @grant GM_addValueChangeListener
// ==/UserScript==

(function() {
    'use strict';
    var profile_var={};

    function insert_values()
    {
        var x;
        //GM_getValue("profile_var",profile_var);
        if(profile_var.not_for_sale!==undefined && profile_var.not_for_sale===true)
        {
            document.getElementById("not_for_sale").checked=true;
            return;
        }
        for(x in profile_var)
        {
            console.log("profile_var[x]="+profile_var[x]);
            document.getElementById(x).value=profile_var[x];
        }
    }
    function parse_zillow(e) {
        if(e!==undefined && e.key !== undefined && e.key !== "v") {
            return;
        }
        console.log("LOADING\n");
        try
        {

            /* var listing_sec=document.getElementById("listing-provided-by-module");
             console.log("listing_sec="+listing_sec.innerText);
            var zsg_media_bd=listing_sec.getElementsByClassName("zsg-media-bd")[0];
              /*  for(var i =0; i < zsg_media_bd_lst.length; i++)
                {
                    console.log(zsg_media_bd_lst[i].innerText);
                }
             var zsg_media_bd=zsg_media_bd_lst[zsg_media_bd_lst.length-1];
                console.log("zsg_media_bd="+zsg_media_bd.innerText);
              var  zsg_split=zsg_media_bd.innerText.split(/,|\s{2-50}|\n/g);
            var a_tag;
                try{
                    a_tag=zsg_media_bd.getElementsByTagName("a")[0].textContent;*/
            var cf_profile_name="";
            try {
                cf_profile_name=document.getElementsByClassName("profile-name-link")[0].textContent;
            }
            catch(error)
            {

            }
            try
            {
                if(cf_profile_name==="")
                {

                    cf_profile_name=document.getElementsByClassName("cf-profile-name-link")[0].textContent;


                }
                //profile_var.brokerage_name=a_tag;
                profile_var.agent_name=cf_profile_name;
            }
            catch(error)
            {
                profile_var.not_for_sale=true;
            }
            GM_setValue("profile_var",profile_var);
            console.log("profile_var="+JSON.stringify(profile_var));
        }
        catch(error) {
            console.log(error);
            for(var x in error)
            {
                console.log("error["+x+"]="+error[x]);
            }
        }

    }
    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var i;
        var loc2,loc3,loc4,loc7;
        var workContent = document.getElementById("workContent");
        var workTable=workContent.getElementsByTagName("table")[0];
        var the_add=workContent.getElementsByTagName("table")[0].rows[0].cells[1].innerText;
        the_add=the_add.replace(/\-/g,".dash.").replace(/\s/g,"-");
        var url_prefix="https://www.zillow.com/homes/";
        var url=url_prefix+the_add+"_rb";
        GM_setClipboard(url);
        GM_setValue("profile_var",profile_var);
       // GM_openInTab(url);
        GM_setValue("url",url);
        GM_addValueChangeListener("profile_var", function() {
            var my_var=GM_getValue("profile_var");

            console.log("MOO"+my_var.agent_name);
            if(my_var.not_for_sale) {

                profile_var.not_for_sale=true;
            }

            profile_var.agent_name=my_var.agent_name;
            profile_var.brokerage_name=workTable.rows[1].cells[1].innerText.split("\n")[0];

            insert_values();
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);


        });
        document.getElementById("agent_name").addEventListener("click",function() {
            var my_var=GM_getValue("profile_var");
  if(my_var.not_for_sale) {

                profile_var.not_for_sale=true;
            }

            console.log("MOO"+my_var.agent_name);
            profile_var.agent_name=my_var.agent_name;
            profile_var.brokerage_name=workTable.rows[1].cells[1].innerText.split("\n")[0];

            insert_values();
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);


        });
       
    }
    else {
        GM_addValueChangeListener("url", function() {
            var new_url=GM_getValue("url");
            window.location.replace(new_url);
        });


        /* Load the script on pressing 'v', run by clicking in the Experience section */
        setTimeout(function() { parse_zillow({}); },0);
        window.addEventListener("keydown",parse_zillow);
    }




})();