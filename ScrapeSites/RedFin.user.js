// ==UserScript==
// @name         RedFin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"[TODO]",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }
    function parse_redfin(doc,url,resolve,reject) {
        var field_map={"BEDROOM_1":"","BEDROOM_2":"","BEDROOM_3":"","BEDROOM_4":"","LIVING_ROOM":"","FAMILY_ROOM":"",
                    "DINING_ROOM":"","KITCHEN":"","ADDITIONAL_ROOM_1":"","ADDITIONAL_ROOM_2":"","ADDITIONAL_ROOM_3":"",
                    "PARKING_SPACES":"","PET_LIMIT":"","ASSESSOR_SQ_FT":"","TOTAL_ROOMS":"","TAX_AMOUNT":"","TAX_YEAR":""};
        var other_sections={"Parking Information":{tag:"PARKING_SPACES",regex:/Spaces:/},
                           "Community Information":{tag:"PET_LIMIT",regex:/Max Pet Weight:/}};
        var size_sections={"Master Bedroom Information":"BEDROOM_1","Living Room Information":"LIVING_ROOM",
                           "Family Room Information":"FAMILY_ROOM",
                           "Dining Room Information":"DINING_ROOM","Kitchen Information":"KITCHEN",
                           "Additional Room #1 Information":"ADDITIONAL_ROOM_1","Additional Room #2 Information":"ADDITIONAL_ROOM_2",
                           "Additional Room #3 Information":"ADDITIONAL_ROOM_3"};

        var groups=doc.querySelectorAll(".amenity-group"),i,curr_group,header;
        for(i=0;i<groups.length;i++) {
            curr_group=groups[i];
            header=curr_group.querySelector(".propertyDetailsHeader");
        }
    }

    /* Following the finding the district stuff */
    function parse_redfin_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;

       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:document.querySelector("form a").href,
                  fields:{"BEDROOM_1":"","BEDROOM_2":"","BEDROOM_3":"","BEDROOM_4":"","LIVING_ROOM":"","FAMILY_ROOM":"",
                    "DINING_ROOM":"","KITCHEN":"","ADDITIONAL_ROOM_1":"","ADDITIONAL_ROOM_2":"","ADDITIONAL_ROOM_3":"",
                    "PARKING_SPACES":"","PET_LIMIT":"","ASSESSOR_SQ_FT":"","TOTAL_ROOMS":"","TAX_AMOUNT":"","TAX_YEAR":""},
                  done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var promise=MTP.create_promise(my_query.url,parse_redfin,parse_redfin_then);
       
    }

})();