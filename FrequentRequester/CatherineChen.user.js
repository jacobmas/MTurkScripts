// ==UserScript==
// @name         CatherineChen
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Determine whether restaurants are chains
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
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_deleteValue
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var my_query = {};
    var bad_urls=default_bad_urls.concat(["hours-locations.com","menuism.com","zomato.com","tripadvisor.com"]);
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1B28RWTG80NTE",false);
    var MTP=MTurkScript.prototype;

    function is_bad_name(b_name)
    {

        return false;
    }

    function same_places(place1,place2)
    {
        place1=place1.toLowerCase().replace(/[\.\,]+/g,"");
        place2=place2.toLowerCase().replace(/[\.\,]+/g,"");
        return place1.indexOf(place2)!==-1 || place2.indexOf(place1)!==-1;
    }

    function has_good_source(b_context)
    {
        var found_good=false, b_entityTP,i,infocard;
        infocard=b_context.getElementsByClassName("infoCardIcons");
        b_entityTP=b_context.getElementsByClassName("b_entityTP");
        if(b_entityTP.length>0 && b_entityTP[0].dataset.feedbkIds==="Retail") return true;
        else if(b_entityTP.length>0) console.log("feedbkIds="+b_entityTP[0].dataset.feedbkIds);
        if(infocard.length===0) return true;
        var inner_a=infocard[0].getElementsByTagName("a");
        for(i=0; i < inner_a.length; i++)
        {
            if(inner_a[i].href.indexOf("en.wikipedia.org")===-1 && inner_a[i].href.indexOf("zillow.com")===-1)
            {
                found_good=true;
                break;
            }
        }
        return found_good;
    }

    function check_b_context(b_context) {
        var b_entityTitle;
        console.log("Found b_context");
        b_entityTitle=b_context.getElementsByClassName("b_entityTitle");
        if(b_entityTitle.length>0) {
            if(!has_good_source(b_context)) return; 
            console.log("Found b_entityTitle");
            var temp_name=MTP.shorten_company_name(b_entityTitle[0].innerText).trim().replace(/,\s*$/,"").trim()
            .replace(/^More about/,"").replace(/ - .*$/,"");
            if(document.getElementsByName("textinput")[0].value.length===0)  {
                console.log("Setting name in b_context\n\n");
                my_query.name=fix_name(temp_name.trim());
                document.getElementsByName("textinput")[0].value=my_query.name;
            }
        }
    }

    function check_ent_cnt(ent_cnt) {
        console.log("Checking ent_cnt");
        var ent_names=[];
        var i,j;
        try {
            for(i=0; i < ent_cnt.length; i++)
            {
                ent_names.push(ent_cnt[i].getElementsByClassName("llc_cont")[0].getElementsByTagName("a")[0].innerText);
            }
        }
        catch(error) { return; }
        console.log("ent_names="+JSON.stringify(ent_names));
        ent_names=[ent_names[0]].concat(ent_names.slice(1).sort());
        if(document.getElementsByName("textinput")[0].value.length===0)
        {
            console.log("Setting name in ent_names\n\n");
            document.getElementsByName("textinput")[0].value=fix_name(ent_names[0]);
        }
        for(j=1; j < ent_names.length; j++)
        {
            if(ent_names[0].toLowerCase()===ent_names[j].toLowerCase())
            {
                console.log("Found good ent_cnt");
                document.getElementsByName("textinput")[1].value="Y";
            }
        }
         console.log("Done Checking ent_cnt");
    }

    function check_acc(doc, acc_colHead)
    {
        var i,j,acc_names=[];
        var b_ans=doc.getElementById("b_results").getElementsByClassName("b_ans")[0]
        var b_focus="";
        if(b_ans.getElementsByClassName("b_focusLabel").length>0) {
            b_focus=b_ans.getElementsByClassName("b_focusLabel")[0].innerText; }
        for(i=0; i < acc_colHead.length; i++)
        {
            if(acc_colHead[i].innerText.indexOf("·")!==-1) acc_names.push(acc_colHead[i].innerText.split(" · ")[0]);
            else acc_names.push(my_query.name);
        }
        acc_names=[acc_names[0]].concat(acc_names.slice(1).sort());
        console.log("acc_names="+JSON.stringify(acc_names));
        if(document.getElementsByName("textinput")[0].value.length===0)
        {
            document.getElementsByName("textinput")[0].value=fix_name(acc_names[0]);
        }
        for(j=1; j < acc_names.length; j++)
        {
            if(acc_names[0].toLowerCase()===acc_names[j].toLowerCase())
            {
                document.getElementsByName("textinput")[1].value="Y";
            }
        }
        if(document.getElementsByName("textinput")[1].length===0)
        {
            document.getElementsByName("textinput")[1].value="N";
        }
    }

    function is_bad_place_name(name)
    {
        console.log("name="+name);
        if(/^USPS /.test(name)) return true;
        return false;
    }

    function is_location_query(the_link,i)
    {
        //console.log("is_location: i="+i+", "+the_link.innerText);
        if(!/[a-z]{2}\.us\//.test(the_link.href) && (
            /\/hotels?\/.+/.test(the_link.href) || /\/hojo\/.+/.test(the_link.href) ||
            /^Locations/i.test(the_link.innerText)
            || /\/locations(\/|$|(?:#!))/i.test(the_link.href)  || /\/stores(\/|$|(?:#!))/i.test(the_link.href)
            || /\/movie-theatres(\/|$|(?:#!))/i.test(the_link.href)
            || /\/location\/.+/i.test(the_link.href)
            || /Store Locator/i.test(the_link.innerText)
            || /Store Locations|(^Store Finder)/i.test(the_link.innerText)
            || /^Find an? /i.test(the_link.innerText)
            || /Find A Store/i.test(the_link.innerText)
            || /Finder\s*\|/i.test(the_link.innerText)
            || /(^|\s)Locator \|/.test(the_link.innerText)

            || /https:\/\/locations\./.test(the_link.href)

            || /\/\?location\=/.test(the_link.href)
            || /\/global\-locations\//.test(the_link.href)

        ))
        {
            return true;
        }
        if(/\/restaurants(\/|$|(?:#!))/i.test(the_link.href))
        {
            console.log("Found restaurants");
            var last_part=the_link.href.match(/\/([^\/]*)$/);
            if(last_part!==null)
            {
                let temp_last=last_part[1].replace(/\-/g," ").toLowerCase();
                console.log("last part not null, my_query.name="+my_query.name+", temp_last="+temp_last);

                if(my_query.name.toLowerCase().indexOf(temp_last)!==-1 || temp_last.indexOf(my_query.name.toLowerCase())!==-1) return false;
                return true;
            }
        }
        if(i===0 && /Locations/i.test(the_link.innerText))
        {
            return true;
        }

        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, j=0,inner_a, b_context, b_entityTitle, b_ans;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption, ent_cnt,llc_cnt,results,p_caption;
        var b1_success=false, b_header_search, ent_names=[], acc_container,acc_colHead,acc_names=[];
        var sa_uc,good_count=0,l_fact;
        try
        {
            b_context=doc.getElementById("b_context");
            search=doc.getElementById("b_content");
            results=doc.getElementById("b_results");
            b_algo=search.getElementsByClassName("b_algo");
            b_ans=search.getElementsByClassName("b_ans");
            l_fact=doc.getElementById("l_fact");
            if(results!=null) acc_container=results.getElementsByClassName("acc-Container");

            if(b_context!==null) check_b_context(b_context);
            
            ent_cnt=doc.getElementsByClassName("ent_cnt");
            console.log("ent_cnt.length="+ent_cnt.length);
            if(ent_cnt.length>1) check_ent_cnt(ent_cnt);
            else if(acc_container.length>0) {
                console.log("Found acc");
                acc_colHead=acc_container[0].getElementsByClassName("acc-colHead");
                if(acc_colHead.length>1) check_acc(doc,acc_colHead);
            }
            for(i=0; i < b_algo.length && i < 3 && good_count<2; i++) {
                 b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption+", good_count="+good_count);
                if(i===0 && b_url.indexOf("bestwestern.com")!==-1) {
                    my_query.name="Best Western";
                     document.getElementsByName("textinput")[0].value=my_query.name;
                }
                console.log("b_url="+b_url+"\tb_name="+b_name);
                if(MTP.is_bad_url(b_url,bad_urls,-1)) { continue; }
                else if(b_algo[i].tagName!=="DIV") good_count++;
                sa_uc=b_algo[i].getElementsByClassName("sa_uc");

                let inner_links=b_algo[i].getElementsByTagName("a");
                for(j=0; j < inner_links.length; j++) {
                  //  console.log("j="+j+", my_query.name="+my_query.name+"\tinner_links="+inner_links[j].innerText);
                    let name_regexp=new RegExp(my_query.name+"(\\s|$)","i");
                   // console.log("("+i+", "+j+"), name_regexp.test(*)="+name_regexp.test(inner_links[j].innerText));
                    if((i>0 || my_query.query_count>=2) && !name_regexp.test(inner_links[j].innerText)) continue;
                    if(is_location_query(inner_links[j],i)) {
                        console.log("Found locations, innerText="+inner_links[j].innerText+
                                    "\thref="+inner_links[j].href);
                        document.getElementsByName("textinput")[1].value="Y";
                    }
                    else if(is_chain(b_algo[i],inner_links[j].href))
                    {
                        console.log("Found chain");
                        document.getElementsByName("textinput")[1].value="Y";
                    }

                }

            }

    

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
       // console.log("document.getElementsByName(textinput)[0].value.length="+document.getElementsByName("textinput")[0].value.length);
         //console.log("document.getElementsByName(textinput)[1].value.length="+document.getElementsByName("textinput")[1].value.length);
        if(document.getElementsByName("textinput")[0].value.length>0 && document.getElementsByName("textinput")[1].value.length>0)
        {
            MTurk.check_and_submit();
            return;
        }
        if(my_query.query_count===0)
        {
            if(document.getElementsByName("textinput")[0].value.length>0) my_query.name=document.getElementsByName("textinput")[0].value;
            my_query.query_count++;
            query_search(""+my_query.name+" "+my_query.parsed_address.state+" locations",resolve,reject,query_response);
            return;
        }
        else if(my_query.query_count===1)
        {
            if(document.getElementsByName("textinput")[0].value.length>0) my_query.name=document.getElementsByName("textinput")[0].value;
            my_query.query_count++;
            query_search("\""+my_query.name+"\" locations",resolve,reject,query_response);
            return;
        }
        else if(my_query.query_count===2)
        {
            if(document.getElementsByName("textinput")[0].value.length===0)
            {
                reject("No name confirmation");
                return;
            }

            document.getElementsByName("textinput")[1].value="N";
            MTurk.check_and_submit();
            return;
        }
        reject("Nothing found");
        return;

    }

    function is_chain(b_algo, url)
    {
        var i,j;
        if(/https?:\/\/[^\.]+\.marriott\.com/.test(url)) return true;
        var inner_links=b_algo.getElementsByTagName("a");
        var b_address="";
        var temp_parsed_address={};

        if(b_algo.getElementsByClassName("b_address").length>0)
        {
            temp_parsed_address=parseAddress.parseLocation(b_algo.getElementsByClassName("b_address")[0].innerText);
        }
        if(temp_parsed_address===null) temp_parsed_address={};
        for(i=0; i < inner_links.length; i++)
        {
            //console.log("inner_links["+i+"].href="+inner_links[i].href);
            var second_regex=/https?:\/\/[^\/]+\/([^\/]+)\/?$/;
            var second_match=inner_links[i].href.match(second_regex);
            if(second_match!==null)
            {
                console.log("("+i+"), second_match="+JSON.stringify(second_match));
             //   console.log("temp_parsed_address="+JSON.stringify(temp_parsed_address));
                if(temp_parsed_address.city!==undefined &&
                   second_match[1].replace(/\-/g," ").toLowerCase()===temp_parsed_address.city.toLowerCase())
                {
                    return true;
                }
            }
        }
        return false;
    }
    function suite_stuff(bm_text) {
        return ((!/Suite/i.test(bm_text) && !/Ste/i.test(bm_text) && !/Suite|Ste/i.test(my_query.address)) ||
                (/Suite|Ste/i.test(my_query.address) && /Suite|Ste/i.test(bm_text)));
    }

    function j_parse_address(str) {
        var result=parseAddress.parseLocation(str);
        if(result===null)
        {
            str=str.replace(/^[^,]+,\s*/,"");
            result=parseAddress.parseLocation(str);

        }
        return result;
    }
    function check_hooters(parsed_lgb) {
        if(parsed_lgb.name && parsed_lgb.url && my_query.parsed_address.city!==undefined &&
           my_query.parsed_address.city.toLowerCase()===parsed_lgb.name.toLowerCase() &&
           /hooters\.com/.test(parsed_lgb.url)) parsed_lgb.name="Hooters";
    }


    function address_query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in address_query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, j=0,inner_a, b_context, b_entityTitle, b_ans, lgb_info;
         var b_url="crunchbase.com", b_name, b_factrow, b_caption, ent_cnt,llc_cnt,lgb_ans, b_vList;
        var b1_success=false, b_header_search, ent_names=[],mt_bizAtAdr,mt_bizList_reg,inner_li=[];
         var bm_details_overlay, sa_uc, loc_hy,parsed_lgb,parsed_context;
         try {
             search=doc.getElementById("b_content");
             lgb_info=doc.getElementById("lgb_info");
             b_algo=search.getElementsByClassName("b_algo");
             mt_bizAtAdr=search.getElementsByClassName("mt_bizAtAdr");
             loc_hy=doc.getElementById("loc_hy");
             if((b_context=doc.getElementById("b_context"))) parsed_context=MTP.parse_b_context(b_context);
             //mt_bizList_reg=search.getElementsByClassName("mt_bizList_reg");
             console.log("b_algo.length="+b_algo.length);
             if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                 console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                 check_hooters(parsed_lgb);
                 if(my_query.name.indexOf("&")===-1) parsed_lgb.name=parsed_lgb.name.replace(/\s*&\s*/g," and ");
                 console.log("parsed_lgb.name="+parsed_lgb.name);
                 var bm_address=j_parse_address(parsed_lgb.address); //parseAddress.parseLocation(bm_text);
                 if(bm_address===null) bm_address={};
                 let b_entitySubTitle="",bad_context=false;
                 if(b_context!==null && parsed_context) {
                     console.log("parsed_context="+JSON.stringify(parsed_context));
                     if(b_context.getElementsByClassName("b_entitySubTitle").length>0) {
                         b_entitySubTitle=b_context.getElementsByClassName("b_entitySubTitle")[0].innerText; }
                     b_vList=b_context.getElementsByClassName("b_vList");
                     if(doc.getElementById("permanently_Closed")!==null) bad_context=true;
                     if(b_vList.length>0) {
                         inner_li=b_vList[0].getElementsByTagName("li");
                         for(i=0; i < inner_li.length; i++) if(/^At:/.test(inner_li[i].innerText)) bad_context=true;
                     }
                     console.log("bad_context="+bad_context);
                 }
                 if((suite_stuff(parsed_lgb.address) &&
                     (!(/#/.test(my_query.address) && !/#/.test(parsed_lgb.address)))
                     && my_query.parsed_address.number!==undefined && bm_address.number!==undefined &&
                     my_query.parsed_address.number===bm_address.number && !/(Building|Mall)$/.test(parsed_lgb.name) &&
                     !/Shopping Mall|Shopping Center/i.test(b_entitySubTitle) && !bad_context
                     && !is_bad_place_name(parsed_lgb.name) && !/^Hooters/i.test(my_query.name)
                    ) || my_query.name.toLowerCase().indexOf(parsed_lgb.name.trim().toLowerCase())!==-1
                    || parsed_lgb.name.toLowerCase().indexOf(my_query.name.replace(/\s[\d]+\s*$/,""))!==-1) {
                     console.log("lgb_info: Resolving on name in address ");
                     resolve(parsed_lgb.name);
                     return;
                 }
             }
             else if(type==="pre_address" && b_context && parsed_context) {
                 console.log("parsed_context="+JSON.stringify(parsed_context));
                 b_entityTitle=b_context.getElementsByClassName("b_entityTitle");
                 //console.log("Found b_entityTitle="+b_entityTitle[0].innerText.trim());
                 if(b_entityTitle.length>0 && has_good_source(b_context) && !/More about /.test(b_entityTitle[0].innerText))
                 {
                     console.log(type+": Found good b_entityTitle="+b_entityTitle[0].innerText.trim());
                     resolve(b_entityTitle[0].innerText.trim());
                     return;
                 }
             }
             else if(type==="address" && mt_bizAtAdr.length>0&&(!loc_hy || loc_hy.getElementsByClassName("ent_cnt")<2))
             {
                 console.log("found biz at adr");
                 inner_li=mt_bizAtAdr[0].getElementsByTagName("li");

                 if(inner_li.length===1 && !is_bad_place_name(inner_li[0].innerText.trim())

                    && (my_query.parsed_address.city===undefined ||
                        my_query.parsed_address.city.toLowerCase()!==inner_li[0].innerText.trim().toLowerCase()))
                 {
                     console.log("Found one");
                     console.log("inner_li.length=1");
                     resolve(inner_li[0].innerText.trim());
                     return;
                 }
                 else if(inner_li.length>1) {
                     console.log("Found more than one");
                     resolve(""); return; }
             }

         }
        catch(error) {
            console.log("Error "+error);
            reject(error);
            return;
        }
        resolve("");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject,type); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }
    function fix_name(to_fix)
    {
        var state_regexp=new RegExp("(,\\s)?"+my_query.parsed_address.state+"\\s*$");
        var city_regexp=new RegExp("([^\\-A-Za-z])"+my_query.parsed_address.city+"\\s*$","i");
        var of_city_regexp=new RegExp("of "+my_query.parsed_address.city+"\\s*$","i");
        to_fix=to_fix.replace(/\/.*$/,"");
        if(city_regexp.test(to_fix))
        {

            console.log("\n\nto_fix.match(city_regexp)="+JSON.stringify(to_fix.match(city_regexp)));
//            to_fix=to_fix.replace(state
        }
        to_fix=to_fix.replace(state_regexp,"");
        if(!of_city_regexp.test(to_fix)) to_fix=to_fix.replace(city_regexp,"$1");
        else {
            let church_regexp=new RegExp("church of "+my_query.parsed_address.city+"\\s*$","i");
            if(!church_regexp.test(to_fix)) to_fix=to_fix.replace(of_city_regexp,"");
        }
        to_fix=to_fix.replace(/ near .*$/,"").replace(/ -.*$/,"")
            .replace(/( by [A-Za-z\d]+)\s.*$/,"$1");

        to_fix=to_fix.replace(/( of [^\-]+)-.*$/,"$1").
        replace(/ at .*$/,"");

        to_fix=to_fix.replace(/^Fogo de Cho$/,"Fogo de Chão");

        return to_fix;
    }

    function address_promise_then(result) {

        if(result.length>0)// && result.toLowerCase().indexOf(my_query.name.toLowerCase())===-1)
        {
            my_query.name=result.replace(/^[^A-Za-z0-9]+/,"");
            my_query.name=fix_name(my_query.name);
            console.log("Setting name in address_promise_then\n\n");
            document.getElementsByName("textinput")[0].value=my_query.name;
        }
        var search_str=""+my_query.name+"";
        if(my_query.parsed_address.state!==undefined)
        {
            search_str=search_str+" "+my_query.parsed_address.state+" locations";
        }
        const queryPromise = new Promise((resolve, reject) => {
         
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });

    }

    function pre_address_promise_then(result) {
        var search_str;
        if(result==="") {
            search_str=my_query.address;
            const addressPromise = new Promise((resolve, reject) => {
                query_search(search_str, resolve, reject, address_query_response,"address");

            });
            addressPromise.then(address_promise_then)
                .catch(function(val) {console.log("Failed at this addressPromise " + val); });
        }
        else
        {
            my_query.name=result.replace(/^[^A-Za-z0-9]+/,"");
            my_query.name=fix_name(my_query.name);
            console.log("Setting name in pre_address_promise_then\n\n");
            document.getElementsByName("textinput")[0].value=my_query.name;
            search_str=""+my_query.name+"";
            if(my_query.parsed_address.state!==undefined) search_str=search_str+" "+reverse_state_map[my_query.parsed_address.state]+" locations";
            const queryPromise = new Promise((resolve, reject) => {
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        }
    }


    function fix_address(bad_address)
    {
        bad_address=bad_address.replace(/,\s*,/g,",").replace(/, [\d]+[A-Za-z]{2} Floor/i,"").
        replace(/,\s*,/g,",").replace(/Ft\. /,"Fort ");
        if(parseAddress.parseLocation(bad_address)===null &&
           bad_address.split(",").length>4) bad_address=bad_address.replace(/^[^,]+,\s*/,"");
        return bad_address;
    }

    function parse_canadian(address)
    {
        var my_regex=/,\s*([^,]+),\s*[A-Z]{2},\s*([A-Z\d]{3}\s[A-Z\d]{3})\s*$/;
         var my_regex2=/([A-Z]{2}),\s*([A-Z\d]{3}\s[A-Z\d]{3})\s*$/;
        var my_match=address.match(my_regex2);
        console.log("my canadian match="+JSON.stringify(my_match));
        if(my_match!==null)
        {
            my_query.parsed_address.state=my_regex2[1];
            my_query.parsed_address.zip=my_regex2[2];
        }
    }

    function adjust_my_query_name() {
        var match_address_re=/,\s*([^,]+),\s*([A-Z]{2})[,\s]+(\d{5})/,temp_match,bob;
        var single_place_str="Government|School District|Church Of|Branch.*Library|Army Air| YMCA|County Schools| Golf Club|(Recreation Center$)| Golf Course"+
            "(Country Club)|(Club$)|(The Club)|(^University of)";
        var single_place_re=new RegExp(single_place_str,"i");
        my_query.name=my_query.bad_name.replace(/ - .*$/,"").replace(/^ECI:\s*/,"").replace(/Ft\. /,"Fort ").trim().replace(/\s*UK$/,"").trim();
        if(my_query.parsed_address.city!==undefined) my_query.name=my_query.name.replace(new RegExp("-\\s*"+my_query.parsed_address.city+".*$"),"");
        if(/^D24/.test(my_query.name)) { my_query.name="Kentucky Fried Chicken"; }
        if(/^LK\d/.test(my_query.name)) { my_query.name="Lyfe Kitchen"; }
        if(/TIJUANA FLATS/.test(my_query.bad_name)) { console.log("Found Tijuana"); my_query.name="Tijuana Flats"; }
        else if(/^\d$/.test(my_query.name.trim())) my_query.name=my_query.bad_name;
        my_query.name=my_query.name.replace(/^([\d]+)([\s]+\-)/,"").replace(/\s*0\d{3,}$/,"");
        if(my_query.parsed_address.state===undefined && (temp_match=my_query.address.match(match_address_re))) {
            Object.assign(my_query.parsed_address,{city:temp_match[1],state:temp_match[2]});
            console.log("temp_match="+JSON.stringify(temp_match));
        }
        if(/TAKE 5 - [^\-]* -/.test(my_query.bad_name) && (temp_match=my_query.bad_name.match(/TAKE 5 - ([^\-]*) -/))) {
            console.log("Matched Take 5");
            my_query.parsed_address.city=temp_match[1];
            Object.assign(my_query,{name:"Take 5 Oil Change",address:my_query.address.replace(/^([^,]+), ([^,]+),/,"$1, "+temp_match[1]+",")});
        }
        else if(/(.*) - (.*)/.test(my_query.bad_name) && (bob=my_query.bad_name.match(/(.*) - (.*)/))) {
           if(my_query.parsed_address.city!==undefined && same_places(bob[2],my_query.parsed_address.city) &&
             /^ECI:/.test(bob[1])) {
               document.getElementsByName("textinput")[0].value=bob[1].replace(/^ECI:\s*/,"");
                document.getElementsByName("textinput")[1].value="Y";
               MTurk.check_and_submit();
               return true;
            }
        }
        else if(single_place_re.test(my_query.bad_name)) {
            document.getElementsByName("textinput")[0].value=my_query.bad_name;
            document.getElementsByName("textinput")[1].value="N";
            MTurk.check_and_submit();
            return true;
        }
        else if((temp_match=my_query.bad_name.match(/^(.*) of (.*)$/i,"")) &&
                (my_query.parsed_address&&my_query.parsed_address.city&&
                 temp_match[2].toLowerCase()===my_query.parsed_addrses.citytoLowerCase())) {
            document.getElementsByName("textinput")[0].value=temp_match[1];
            document.getElementsByName("textinput")[1].value="N";
            MTurk.check_and_submit();
            return true;
        }
        return false;
    }

    function init_Query() {
       // var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={bad_name: wT.rows[0].cells[1].innerText, bad_address: wT.rows[1].cells[1].innerText,query_count:0,
                 foundYelp:false};
        my_query.address=fix_address(my_query.bad_address);
        my_query.parsed_address=parseAddress.parseLocation(my_query.address)||{};
        if(my_query.state===undefined) parse_canadian(my_query.address);
        if(adjust_my_query_name()) return; // fix up query name, return if submitting
        if(my_query.parsed_address.city!==undefined && my_query.parsed_address.state!==undefined &&
           my_query.parsed_address.zip!==undefined) {
            my_query.short_address=my_query.parsed_address.city+", "+my_query.parsed_address.state+" "+my_query.parsed_address.zip;
        }
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=""+my_query.name+" "+my_query.address;//+" site:yelp.com";
        const pre_addressPromise = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, address_query_response,"pre_address");
        });
        pre_addressPromise.then(pre_address_promise_then)
        .catch(function(val) {
           console.log("Failed at this pre_addressPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
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

})();
