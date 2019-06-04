// ==UserScript==
// @name         Reformscrape
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include http://www.trystuff*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
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
    var congregation_list=[];
    var my_query = {pos:0};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"[TODO]",false);
    var MTP=MTurkScript.prototype;
    begin_script();
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

    function parse_reform(doc,url,resolve,reject,pos) {
        console.log("In parse_reform, url="+pos);
        var art=doc.querySelectorAll("article"),curr;
        var name,address_text,cong_url,parsed, cong_a,cong;
        for(curr of art) {
            cong={name:"",street:"",city:"",state:""};
            name=curr.querySelector("h2").innerText.trim();
            cong.name=name;
            address_text=(curr.querySelector("article .field-items")?curr.querySelector("article .field-items").innerText.trim():"").
            replace(/,\s*(US|Canada)\s*$/i,"");
            cong_a=curr.querySelector("article .website a");
            cong_url=cong_a?cong_a.href:"";
            cong.url=cong_url;
            var add_re=/^(.*),\s*([^,]*),\s*([^,]*)$/,add_match;
            parsed=parseAddress.parseLocation(address_text);

            if(add_match=address_text.match(add_re)) {
                cong.street=add_match[1];
                cong.city=add_match[2];
                cong.state=add_match[3];
            }
            else {
                cong.street=address_text;
            }
            congregation_list.push(cong);
        }
        resolve("");
    }
    function scrape_reform(pos) {
        if(pos>=85) {
            print_congregations();
            return; }
        var url="https://urj.org/find-a-congregation/keywords?page="+pos;
        var promise=MTP.create_promise(url,parse_reform,function() {
            pos++;
            scrape_reform(pos);
        },MTP.my_catch_func,pos);
    }
    function print_congregations() {
        var str,curr;
        var wrapper=document.getElementById("wrapper");

        for(curr of congregation_list) {
            str=str+curr.name+";"+curr.street+";"+curr.city+";"+curr.state+";"+curr.url+"<br>";
        }
        wrapper.innerHTML=str;
    }


    function init_Query()
    {
        console.log("in init_query");
        var wrapper=document.getElementById("wrapper");
        wrapper.innerHTML="";
        scrape_reform(0);
    }

})();