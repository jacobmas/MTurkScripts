// ==UserScript==
// @name         Charlie Steward
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  honestjohn
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
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
// @connect honestjohn.co.uk
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A34PWQTJY9PUEB",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function parse_honestjohn_then(result) {
        console.log(result);
        submit_if_done();
    }

    function Version(spec_text,price,url) {
        this.Spec_Terms=spec_text.split(" ");
        this.price=price.replace(/[^\d]+/g,"");
        this.url=url;
        this.quality=0;
        var my_term,their_term;
        for(my_term of this.Spec_Terms) {

            if(my_term.toLowerCase()===my_query.car.Derivative.toLowerCase()) this.quality+=6;
            for(their_term of my_query.car.Spec_Terms) {
                console.log("my_term="+my_term+", their_term="+their_term);
                if(my_term.toLowerCase()===their_term.toLowerCase()) this.quality++;
            }
        }
    }
   function cmp_versions(version1,version2) {
        if(!(version1 instanceof Version && version2 instanceof Version)) return 0;
        return version2.quality-version1.quality;
    }
    function parse_data(doc,url,resolve,reject) {
        console.log("parse_data,url="+url);
        var the_links=doc.querySelectorAll("#mainContent td a"),i;
        var version_lst=[];
        var curr_row,price,curr_v;
        /* Skip the rightmost details link */
        for(i=0;i<the_links.length;i+=2) {
            curr_row=the_links[i].parentNode.parentNode;
            console.log("("+i+"), curr_row="+curr_row);

            if(curr_row.cells.length>=2) {
                curr_v=new Version(the_links[i].innerText.trim(),curr_row.cells[1].innerText.trim(),MTP.fix_remote_url(the_links[i].href,url));
                version_lst.push(curr_v);
            }
        }
        version_lst.sort(cmp_versions);
        console.log("version_lst="+JSON.stringify(version_lst));
        if(version_lst.length>0) {
            curr_v=version_lst[0];
            my_query.fields.New_price=curr_v.price;
            my_query.fields.Source_URL=curr_v.url;
            resolve("Success");
            return;
        }
        console.log("version_lst empty, failing");
        reject("Failed");
        return;

    }

    function parse_makes(doc,url,resolve,reject) {
        console.log("parse_makes,url="+url);
        var title=doc.querySelectorAll(".title a"),i;
        var title_lst=[];
        var semi_match_lst=[];
        var promise;
        var title_match,title_re=/^([^\(]*)\s\(([^\-]*)\s-\s([^\)]*)\)/;
        var curr_title,temp_title_elem;
        for(curr_title of title) {
            curr_title.href=MTP.fix_remote_url(curr_title.href,url);
            if((title_match=curr_title.innerText.match(title_re))) {
                temp_title_elem={model:title_match[1].trim(),begin:title_match[2].trim(),end:title_match[3].trim(),url:curr_title.href};
                if(temp_title_elem.end.length<4) temp_title_elem.end=2019;
                title_lst.push(temp_title_elem);
            }
            else console.log("Failed to match "+title_re+" on "+curr_title.innerText);
        }
        for(curr_title of title_lst) {
            console.log("curr_title="+JSON.stringify(curr_title));
            if(my_query.car.Model.toLowerCase()===curr_title.model.toLowerCase() && (
            my_query.car.Start_Year>=curr_title.begin && my_query.car.End_Year<=curr_title.end)) {
                console.log("Successfully matched with "+JSON.stringify(curr_title));
                promise=MTP.create_promise(curr_title.url+"/data",parse_data,resolve,reject);
                return;
            }
            else if((my_query.car.Model.toLowerCase().indexOf(curr_title.model.toLowerCase())!==-1 ||
                     curr_title.model.toLowerCase().indexOf(my_query.car.Model.toLowerCase())!==-1)

                    && (
            my_query.car.Start_Year>=curr_title.begin && my_query.car.End_Year<=curr_title.end)) {
                console.log("Successfully semi_matched with "+JSON.stringify(curr_title));
                semi_match_lst.push(curr_title);
               // var promise=MTP.create_promise(curr_title.url+"/data",parse_data,resolve,reject);
                //return;
            }
        }
        semi_match_lst.sort(function(c1,c2) {
            return parseInt(c1.end)-parseInt(c2.end);
        });
        console.log("semi_match_lst="+JSON.stringify(semi_match_lst));
        if(semi_match_lst.length>0) {
            console.log("semi match, proceeding with "+JSON.stringify(semi_match_lst[0]));
              promise=MTP.create_promise(semi_match_lst[0].url+"/data",parse_data,resolve,reject);
                return;
        }
        console.log("Failed to match");
        reject("");
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
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }
    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }


    function parse_Charlie() {
        var i;
        var item_re=/^([^:]*):\s*(.*)$/;
        var p=document.querySelectorAll("crowd-form div div div p"),match;
        for(i=1;i<p.length;i++) {
            if((match=p[i].innerText.match(item_re))) my_query.car[match[1].replace(/ /g,"_")]=match[2].trim();
        }
        if(my_query.car.Spec) {
            my_query.car.Spec_Terms=my_query.car.Spec.split(" ");
            if(my_query.car.Doors) my_query.car.Spec_Terms.push(my_query.car.Doors+"dr");
            if(my_query.car["Drive type"]&&
               my_query.car["Drive type"]==="Front Wheel Drive") my_query.car.Spec_Terms.push("FWD");
        }

        if(my_query.car.Start_of_production && my_query.car.End_of_production) {
            my_query.car.Start_Year=(my_query.car.Start_of_production==="NULL"?2019:
                                     parseInt(my_query.car.Start_of_production.substring(my_query.car.Start_of_production.length-4)));
            my_query.car.End_Year=(my_query.car.End_of_production==="NULL"?2019:
                                     parseInt(my_query.car.End_of_production.substring(my_query.car.End_of_production.length-4)));

        }
        else {
            my_query.car.Start_Year=1950;
            my_query.car.End_Year=2019;
        }

    }
    function init_Query() {
        console.log("in init_query");
        document.querySelectorAll("crowd-input").forEach(function(elem) {
            elem.type="text";
            elem.required=false;
        });
        var i;
        my_query={name:"",car:{},fields:{"New_price":"","Source_URL":""},done:{},submitted:false};
        parse_Charlie();
	console.log("my_query="+JSON.stringify(my_query));
        my_query.make_url="https://www.honestjohn.co.uk/carbycar/"+my_query.car.Make.toLowerCase().replace(/\s/g,"-");
        var promise=MTP.create_promise(my_query.make_url,parse_makes,parse_honestjohn_then,function(response) {
            console.log("Failed honestjohn "+response);
            GM_setValue("returnHit"+MTurk.assignment_id,true); }
            );
    }

})();