// ==UserScript==
// @name         Kimberly Script
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
    var rows = webData.getElementsByClassName("row");

    var dealer_name="";
    var row1= rows[1];
    var row2=rows[2];
    var url_text="";
    var well2=row2.getElementsByClassName("well");
    var url1=row1.getElementsByClassName("well")[0];
    console.log("url1"+url1);

    document.getElementsByName("Cars")[0].value="";
    the_lab=row2.getElementsByTagName("label")[0];
    if(url1.children[0] !== null)
    {
        url_text=url1.children[0].innerHTML;
        if(url_text.length>=5&&url_text.substr(0,5)!=="http:"&&url_text.substr(0,5)!=="https") {
            url_text="http://"+url_text;
        }
        document.getElementsByName("website_url")[0].value=url_text;
    }
    if(well2[0].children[0] !== null)
    {
        url_text=well2[0].children[0].innerHTML;
        if(url_text.length>=5&&url_text.substr(0,5)!=="http:"&&url_text.substr(0,5)!=="https") {
            url_text="http://"+url_text;
        }

        document.getElementsByName("website_url2")[0].value=url_text;
    }

    var street="",city="",state="";
    if(well2[2].children[0] !== null)
    {
        street=well2[2].children[0].innerHTML;
    }
    if(well2[3].children[0] !== null)
    {
        city=well2[3].children[0].innerHTML;
    }
        if(well2[4].children[0] !== null)
    {
        state=well2[4].children[0].innerHTML;
    }
    if(well2[2].children[0] !== null)
    {
        well2[2].innerHTML=street+", " + city +" " + state;
    }
    if(well2[1].children[0] !== null)
    {
        dealer_name=well2[1].children[0].innerHTML;
        well2[1].innerHTML=dealer_name+"<br>"+street+", " + city +" " + state;
        well2[1].style.marginBottom="5px";
        well2[1].style.padding="10px";
    }

    // Your code here...
    row1.parentNode.removeChild(row1);

    for(i=0; i < 1; i++)
    {
        the_lab=row2.getElementsByTagName("label")[0];
        the_well=row2.getElementsByClassName("well")[0];
        the_lab.parentNode.removeChild(the_lab);
        the_well.parentNode.removeChild(the_well);
    }
    for(i=3; i >=0; i--)
    {
        the_lab=row2.getElementsByTagName("label")[i];
        the_well=row2.getElementsByClassName("well")[i];

        the_lab.parentNode.removeChild(the_lab);
        if(i >= 1)
            the_well.parentNode.removeChild(the_well);
    }
/*    var provEl=document.getElementsByName("City")[0];
    provEl.addEventListener("click", function(e) {
        var provName=GM_getValue("dealer_name");
        console.log(GM_getValue("dealer_name"));
        provEl.value=provName;
        GM_setValue("dealer_name","");
    });
    provEl.addEventListener("paste",function(e) {
        //GM_setClipboard("","text"); });*/

})();