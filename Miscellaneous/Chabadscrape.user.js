// ==UserScript==
// @name         Chabadscrape
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Chabad
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
    var state_url_list=[];
    var city_url_list={};
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

  
    function scrape_chabad(doc,url,resolve,reject) {
        var state_urls=doc.querySelectorAll(".content table a"),x;
        for(x of state_urls) {
            if(/\/New%20Jersey/.test(x.href)) state_url_list.push(MTP.fix_remote_url(x.href,url).replace(/undefined$/,""));
        }
        scrape_states(url,resolve,reject,0);
    }
    function scrape_states(url,resolve,reject,pos) {
        console.log("scrape_states, url="+url+", pos="+pos);
        if(pos >= state_url_list.length) {
            resolve("");
            return;
        }
        var promise=MTP.create_promise(state_url_list[pos],scrape_state,function() {

            console.log("BEGINNNING STATE "+(pos+1));
            scrape_states(state_url_list[pos+1],resolve,reject,pos+1) },MTP.my_catch_func,pos);
    }
    function scrape_state(doc,url,resolve,reject,pos) {

        var match=url.match(/default_cdo\/state\/([^\/]*)/);
        var state="";
        var promise;
        var promise_list=[],x;
        if(match) {
            state=match[1];
            city_url_list[state]=[];
        }
        console.log("scrape_state, state="+state+", url="+url);
        var city_urls=doc.querySelectorAll(".content table[cellpadding='2'] a");
        for(x of city_urls) {
            city_url_list[state].push(MTP.fix_remote_url(x.href,url));
        }
        var city_pos=0;
        if(city_url_list[state].length>0) {
            scrape_cities(city_url_list[state][city_pos],resolve,reject,state,city_pos); }

          /*  var promise=MTP.create_promise(city_url_list[state][city_pos],scrape_city,function() {
                console.log("BEGINNNING CITY "+city_url_list[state][city_pos+1]);
                scrape_states(state_url_list[pos+1],resolve,reject,pos+1)*/
/*        for(x of city_url_list[state]) {
            promise_list.push(MTP.create_promise(x,scrape_city,MTP.my_then_func,MTP.my_catch_func));
        }*/
       // Promise.all(promise_list).then(function() { resolve(""); });
    }

    function scrape_cities(url,resolve,reject,state,city_pos) {
        console.log("scrape_cities, url="+url+", pos="+city_pos);
        if(city_pos >= city_url_list[state].length) {
            resolve("");
            return;
        }
        var promise=MTP.create_promise(city_url_list[state][city_pos],scrape_city,function() {

            console.log("BEGINNNING CITY "+(city_pos+1)+", url="+city_url_list[state][city_pos+1]);
            scrape_cities(city_url_list[state][city_pos+1],resolve,reject,state,city_pos+1) },MTP.my_catch_func,city_pos);
    }

    /* Scrape an individual Chabad House */
    function scrape_chabadhouse(doc,url,resolve,reject) {
        console.log("scrape_chabadhouse,url="+url);
        var black=doc.querySelectorAll(".content > table[cellspacing='0']  .black");
        var h1=doc.querySelectorAll(".content > table[cellspacing='0'] h1");
        var n,j;
        var a=doc.querySelectorAll(".content > table[cellspacing='0']  .black a"),new_url;
        var curr={};
        curr.name=h1[0].innerText.trim();
        if(black.length>0) {
            n=black[0].childNodes;
            curr.address="";
            if(n.length>=3) {
                for(j=0;j<n.length;j+=2) {
                    //       console.log("n["+j+"].textContent="+n[j].textContent);
                    curr.address=curr.address+(curr.address.length>0?",":"")+n[j].textContent.trim(); }
                curr.address=curr.address.replace(/\s+[-\d]*\s+USA,*$/,"");
            }
            //&& (match=black[0].innerText.match(/^.*\n*.*USA/))) {
            //curr.address=match[0];
        }
        var y;

        if(a.length>0 && (new_url=MTP.fix_remote_url(a[0].href,url)) &&
           !/https:\/\/www\.chabad\.org/.test(new_url)) curr.url=new_url;
      //  console.log("curr="+JSON.stringify(curr));
        try_push_cong(curr);
        resolve("");

    }

    function scrape_city(doc,url,resolve,reject) {
        console.log("url="+url);
        var x,i,n,j,k;
        var curr={},match,str;
        var add_match;
        var promise_list=[];
        var cong=doc.querySelectorAll(".content > table[cellspacing='0']"),curr_cong;

        var black;
        var h1=doc.querySelectorAll(".content > table[cellspacing='0'] h1");
        var nextImg=doc.querySelector("img[alt='Next']");

        if(h1.length>0) {
          //  console.log("FOUND h1");
            scrape_chabadhouse(doc,url,resolve,reject);
            return;
        }
        else {
            for(curr_cong of cong) {
                black=curr_cong.querySelectorAll(".black");

                curr={};
                if(black.length>=3) {
                    var inner_a=black[0].querySelector("a");
                    if(inner_a) {
                        promise_list.push(MTP.create_promise(MTP.fix_remote_url(inner_a.href,url),scrape_chabadhouse,MTP.my_then_func,MTP.my_catch_func));
                    }
                    else {
                        curr.name=black[0].innerText.trim().replace(/^[\d]*\.\s*/,"");

                        //  console.log("black["+(black.length-3)+"].innerText="+black[black.length-3].innerText);
                        n=black[black.length-3].childNodes;
                        curr.address="";
                        if(n.length>=2) {
                            for(j=0;j<n.length;j++) {
                                //      console.log("n["+j+"].textContent="+n[j].textContent);
                                if(n[j].nodeType===Node.TEXT_NODE) {
                                    curr.address=curr.address+(curr.address.length>0?",":"")+n[j].textContent.trim();
                                }
                            }
                            //console.log("curr.address before replace="+curr.address);
                            curr.address=curr.address.replace(/\s+[-\d]*\s+USA,*$/,"");
                        }
                        console.log("curr="+JSON.stringify(curr));
                        try_push_cong(curr);
                    }



                }
            }
            if(nextImg&&nextImg.parentNode&&nextImg.parentNode.tagName==="A") {
                var next_url=MTP.fix_remote_url(nextImg.parentNode.href,url);
                var promise=MTP.create_promise(next_url,scrape_city,resolve,reject);
                return;
            }
            else if(nextImg) {
               // console.log("nextImg="+nextImg+", nextImg.parentNode="+nextImg.parentNode);
            }
            Promise.all(promise_list).then(function() {
                resolve("");
            });
        }
        
    }



    function try_push_cong(curr) {
        var i;
        for(i=0;i<congregation_list.length;i++) {
            if(curr.name===congregation_list[i].name) return;
        }
        congregation_list.push(curr);
    }

    function print_congregations() {
        var str="",curr;
        var wrapper=document.getElementById("wrapper");
        var add_re=/^(.*),\s*([^,]*),\s*([A-Z]{2})\s*$/,add_match;
        for(curr of congregation_list) {
            if((add_match=curr.address.match(add_re))) {
                curr.street=add_match[1];
                curr.city=add_match[2];
                curr.state=add_match[3];
            }
            else if((add_match=curr.address.match(/^([^,]*),\s*([A-Z]{2})\s*$/))) {
                curr.street="";
                curr.city=add_match[1];
                curr.state=add_match[2];
            }


            str=str+curr.name+";"+curr.city+";"+curr.state+";;Ortho;Chabad;Chabad;;;;;;;;;;;"+curr.street+";"+(curr.url||"")+"<br>";
        }
        wrapper.innerHTML=str;
    }
    function scrape_chabad_then() {
        print_congregations();
    }


    function init_Query()
    {
        console.log("in init_query");
        var wrapper=document.getElementById("wrapper");
        wrapper.innerHTML="";
        var begin_url="https://www.chabad.org/centers/default_cdo/country/USA/jewish/Chabad-Lubavitch.htm";
        var promise=MTP.create_promise(begin_url,scrape_chabad,scrape_chabad_then);
    }

})();