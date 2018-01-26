// ==UserScript==
// @name         FindDealer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      *
// @exclude        http://*.amazonaws.com/*
// @exclude        https://*.amazonaws.com/*
// @exclude        http://*.mturk.com/*
// @exclude        https://*.mturk.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_setClipboard
// ==/UserScript==


(function() {

    'use strict';
    var my_func=function(dealer_name)
    {
        GM_setClipboard(dealer_name,"text");
          GM_setValue("dealer_name",dealer_name);
    };
    var dealer_name=GM_getValue("dealer_name","");
    var bob=document.getElementsByName("copyright");
    if(bob!== null && bob.length>0 && bob[0].tagName === "META")
    {
        console.log("meta");
        if(bob[0].content.match("AutoCorner")!== null)
        {
            console.log("match");
            dealer_name="AutoCorner";
            my_func(dealer_name);
            return;
        }
        else
        {
            console.log(bob[0].content);
        }
    }

    bob=document.getElementsByClassName("dcsLogin");
    console.log("bob="+bob.length);
  
    if(bob!==null && bob.length>0) { dealer_name="Dealer Car Search"; my_func(dealer_name); return; }
    bob=document.getElementById("revoLink");
    if(bob !== null) { dealer_name="AutoRevo"; my_func(dealer_name); }
    bob=document.getElementsByClassName("link");
    if(bob!== null && bob[0] !== null && bob[0]!==undefined && bob[0].href!== null && bob[0].href.match("dealer.com")!==null) { dealer_name="dealer.com"; }
//    if(dealer_name!=="") alert(dealer_name);
    bob=document.getElementsByClassName("di-version");
    if(bob!==null && bob.length>0)
    {
        console.log("bob3="+bob.length);
 //       alert("MOO");
        dealer_name="Dealer Inspire";
        my_func(dealer_name);
        return;
    }
    GM_setValue("dealer_name",dealer_name);
    console.log("dealer_name="+dealer_name);
    GM_setClipboard(dealer_name,"text");
    // Your code here...
})();