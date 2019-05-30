// ==UserScript==
// @name         ASOCLawITAdminCommRec
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find employees for law enforcement agency
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
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/a1d806c820e6044da10293934226642af8960f37/Govt/Government.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var debug=false;
    var bad_urls=default_bad_urls.concat(["zillow.com","localtown.us","usacops.com","sheriffs.org","facebook.com","en.wikipedia.org",
                                         "hometownlocator.com"]);
    var MTurk=new MTurkScript(50000,200,[],begin_script,"A3T3RIGHXP9IK4",false);
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

    var MTP=MTurkScript.prototype;
    function try_bad_name_again(b_name,p_caption,site,pos) {
       // console.log("in try_bad_name");
        if(/(^|\s|,)Mt\.($|\s|,)/.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)Mt\.($|\s|,)/,"$1Mount$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)St\.($|\s|,)/.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)St\.($|\s|,)/,"$1Saint$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)St\./.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)St\./,"$1Saint ");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)ISD($|\s|,)/i.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)ISD($|\s|,)/i,"$1I.S.D.$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/(^|\s|,)Twp(\.?)(\s|$|,)/i.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)Twp(\.?)(\s|$|,)/i,"$1Township$2");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/\s-\s/.test(b_name))
        {
            b_name=b_name.replace(/\s-\s/g,"-");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        else if(/-/.test(b_name))
        {
            b_name=b_name.replace(/-/g," ");
             console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        return true;
    }

    function acronym(text)  {
        text=text.replace(/([A-Za-z]{1})-([A-Za-z]{1])/,"$1 $2");
        var ret="",t_split=text.split(" ");
        for(var i=0; i < t_split.length; i++)
            if(/[A-Z]+/.test(t_split[i].substr(0,1))) ret=ret+t_split[i].charAt(0);
        return ret;
    }

    function is_school_district(text) {
        return /(\s|^|[a-z]+)(District|Schools|Public School|Local School|((I(\.)?)?S(\.)?D(\.)?)|USD)([\s,]+|$)/i.test(text);
    }
    function is_bad_name(b_name,p_caption,site,pos)  {
        b_name=b_name.replace(/^The\s*/,"").replace(/\'/g,"").replace(/^(Welcome to|Government of) (the )?/i,"");
        b_name=b_name.replace(/(Village|Government|City|County) Offices/i,"$1");

        var orig_b_name=b_name;
        b_name=b_name.toLowerCase().trim();

        var name_minus_state=my_query.agency_name.replace(/,.*$/,"");
        var state_regexp=new RegExp("(\\s|,)"+my_query.state+"(\\s|$|\\.)");
         var county_acronym=acronym(my_query.agency_name.replace(/,.*$/,""));
        var x,bad_state_reg;
        for(x in reverse_state_map)
        {
            if(x===my_query.state) continue;
            bad_state_reg=new RegExp(my_query.short_name+",\\s*"+reverse_state_map[x],"i");
           // console.log("bad_state_reg="+bad_state_reg+", b_name="+b_name);
            if(bad_state_reg.test(b_name))
            {
                console.log("Wrong state, found "+reverse_state_map[x]+", should be "+reverse_state_map[my_query.state]);
                return true;
            }
        }
        console.log("# b_name="+b_name+", county_acronym="+county_acronym);

        var name_regexp=new RegExp("(^|[^A-Za-z]{1})"+my_query.short_name.toLowerCase().replace(/-/,"(-|\\s)")+"($|[^A-Za-z]{1})");

        console.log(name_regexp+".test("+b_name+")="+name_regexp.test(b_name));
//b_name.indexOf(my_query.short_name.toLowerCase())===-1           && b_name.indexOf(my_query.short_name.toLowerCase().replace(/-/g," "))===-1
        if(!name_regexp.test(b_name)
          && !(county_acronym.length>1 && new RegExp(county_acronym,"i").test(b_name))
          )
        {
                console.log("Failed to find "+my_query.short_name.toLowerCase());
                return try_bad_name_again(orig_b_name,p_caption,pos);

        }
       /* else if(!/^(City|Town|Village|County|Municipality|Township|Borough)/i.test(b_name)
                && b_name.indexOf(my_query.short_name.toLowerCase())>0)
        {
            console.log("Bad beginning");
            return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }*/
        else if((pos>0) && !state_regexp.test(orig_b_name) &&
                //orig_b_name.indexOf(my_query.state+".")===-1 &&
                b_name.indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
                &&
                !state_regexp.test(p_caption) &&
         //   p_caption.indexOf(my_query.state+".")===-1 &&
                p_caption.toLowerCase().indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
            && b_name.indexOf(name_minus_state.toLowerCase())===-1)
        {
            console.log("Failed to find state");

        }
        var bad_places="Baptist|Church|Firefighters|Fire|Police|Sports|Sport|Baptist|Cool|([A-Z]*ISD)|Chamber|FFA|PBA|Pulse|"+
            "Magazine|Store|Liquor|Hockey[a-z]*|City Council|Recreation|Program|Committee|Democratic|Auto[a-z]*|Club|"+
            "Tourism|Wildlife|GOP|Democrat[a-z]*|Neighborhood Watch|Art|Mountain|Athletics|Library|Baseball|Football|Magazine|"+
            "Medical|Soccer|Patch|Pharmacy|Rec|Yoga|Resort|Development|Company|FPG|Herald|Tribune|Star|Times|UMC|Country Club|"+
            "Planning|Neighborhood|Clerk|Department|Recreation|Program|Committee|Office of|"+
            "Ambulance|School|"+
            "PD|FD|"
            "USD|ISD|School[a-z]{0,1}|HS|Elementary";
        var bad_twitter_places="([A-Z]{1}[a-z]+s)|([A-Z]{2,})|([\d]+)|Football"
        var bad_places_regexp=new RegExp("\\s"+bad_places+"(\\s|[,\/\.]{1}|$|-)","i");
        var bad_stuff_regexp=new RegExp(my_query.short_name+",?(-[^\\s]*)?\\s([^\\s]+\\s){0,3}("+bad_places+
                                        ")(\\s|[,\/\.]{1}|$|-)","i");
        var bad_twitter_regexp=new RegExp(my_query.short_name+",?(-[^\\s]*)?\\s([^\\s]+\\s){0,3}("+bad_twitter_places+
                                        ")(\\s|[,\/\.]{1}|$|-)","i");
        var before_bads="Company|Larry";
        var before_bad_stuff_regexp=new RegExp("^("+before_bads+")\\s([^\\s]+\\s){0,3}"+my_query.short_name+"(\\s|,|$|-)","i");
        console.log("before_bad_stuff_regexp="+before_bad_stuff_regexp);
        if(/(\s)Recreation Division|Public Works(\s|,|-|$)/i.test(b_name)
          || (bad_stuff_regexp.test(b_name)) || before_bad_stuff_regexp.test(b_name)
           || (!name_regexp.test(b_name)&&bad_places_regexp.test(b_name))
          )
        {
            let bad_match=b_name.match(bad_stuff_regexp);
            console.log("bad_match="+JSON.stringify(bad_match));
            if(!(bad_match && (bad_match[3].indexOf(my_query.state.toLowerCase())!==-1 ||
                              bad_match[3].indexOf(reverse_state_map[my_query.state].toLowerCase())!==-1)))
            {
                console.log("bad name");
                return true;
            }
        }
        var of_regex=new RegExp("^(.*) of "+my_query.short_name,"i");

        if(of_regex.test(orig_b_name))
        {
            var match=orig_b_name.match(of_regex);
            var type=my_query.orig_name.match(/^(.*)\sof\s/);
            var type_regex="";
            if(type) type_regex=new RegExp("^"+type[1],"i");
            console.log("type_regex="+type_regex);
            if(match && type && !type_regex.test(match[1]) && !((type[1]==="City" && match[1]==="Town")||(type[1]==="Town" && match[1]==="City")))
            {
                console.log("Bad match, "+type[1]+" not found at beginning of "+match[1]);
                return try_bad_name_again(orig_b_name,p_caption,site,pos);
            }
        }


        var p_caption_regexp=new RegExp("(\\s|,|^)(bank locations|Automotive)(\\s|,|$)","i");
        var p_caption_first=p_caption.split(/[!\.\?]+/)[0];


        if(/NOT affiliated with/i.test(p_caption)) {
            console.log("Unaffiliated page");
            return true;
        }

       // if(site==="twitter") return is_bad_twitter_name(orig_b_name,p_caption,site,pos);

        return false;
    }
    function is_bad_name2(b_name,p_caption,search_str,b_url) {
        var b_split=b_name.split(/\s+[\|\-:]\s+/),i,x;
        var search_str_begin=search_str.replace(/\s*,.*$/,"").replace(/\s/g,"");
        var lst=[" School"," Resort"," Communications"," Clinic","Historic Site"," Company"," Law Firm", "Furniture"],temp_regexp;
        if(/not-for-profit/.test(p_caption)) return true;
        for(i=0;i<lst.length;i++) {
            temp_regexp=new RegExp(lst[i]);
            if(temp_regexp.test(b_name) && !temp_regexp.test(search_str)) return true; }
        search_str=search_str.replace(/\s*,.*$/,"");
        if(/Chamber of Commerce|Restaurants|Shopping|Visit|Visitor|Country Club|Methodist|Baptist|Presbyterian/.test(b_name)) return true;
        if(/(chamber\.(org|com))|(chamberofcommerce)|(\.edu)/.test(b_url)) return true;
        if(/(^|[^A-Za-z]+)(Fun|Festivals|CUSD|home center|Bank of|Motors|Hotel|Inc\.|Travel Information|School|Recycling)($|[^A-Za-z]+)/i.test(b_name)) return true;
        if(/(^|[^A-Za-z]+)(Apartment Home|unofficial site)($|[^A-Za-z]+)/i.test(p_caption)) return true;
        //if(/^\s*Visit /.test(p_caption)) return true;
        for(x in reverse_state_map) {
            if(x===my_query.state) continue;
            if(new RegExp(search_str_begin+"(-)?"+x,"i").test(b_url)||new RegExp(search_str_begin+"(-)?"+reverse_state_map[x],"i").test(b_url)) return true;
            if(new RegExp("(^|[^A-Za-z]+)"+x+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp(",\\s*"+reverse_state_map[x]+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp("\\."+x+"\\.us","i").test(b_url)) return true;
        }
        console.log("Up to checking b_splits");
        for(i=0;i<b_split.length;i++) {
            console.log("search_str="+search_str+", b_split["+i+"]="+b_split[i]);
            if(MTP.matches_names(my_query.agency_name.replace(/,.*$/,""),b_split[i])||
               MTP.matches_names(my_query.agency_name.replace(/,.*$/,""),b_split[i].replace(/^(Town|Village|Township|Municipality|City) of /i,""))) return false;
        }


        return true;
    }

    function query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success) {
        var b_name,b_url,p_caption,b_caption;
        var mtch,j,people;
        b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
        b_url=b_algo[i].getElementsByTagName("a")[0].href;
        b_caption=b_algo[i].getElementsByClassName("b_caption");
        p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
            p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
        console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);

    }

    function query_response(response,resolve,reject,type,search_str) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0,j,mtch, inner_a,promise_list=[];
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            /*console.log("b_algo.length="+b_algo.length);*/
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.url&&parsed_context.Title
                   &&!MTP.is_bad_url(parsed_context.url,bad_urls,4,2)) {

                  /* resolve(parsed_context.url);
                    return;*/
                }
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info)) && parsed_lgb.url&&parsed_lgb.url.length>0 &&
               MTP.get_domain_only(window.location.href,true)!==
               MTP.get_domain_only(parsed_lgb.url,true)&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,6,3)) {

                //resolve(parsed_lgb.url);
                //return;

            }
            for(i=0; i < b_algo.length&&i<3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)?b_caption[0].getElementsByTagName("p")[0].innerText:"";
                 console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/query/.test(type) && (!MTP.is_bad_url(b_url,bad_urls,6,2)) && (
                                                            !is_bad_name2(b_name,p_caption,search_str,b_url))
                   && !(parsed_context&&parsed_context.url&&/^\s*Visit/i.test(b_name)) &&

                   (b1_success=true)) break;
                   if(/fb/.test(type) &&  (!ASOC.agency_regex[my_query.agency_type] || ASOC.agency_regex[my_query.agency_type].test(b_name)) &&
                                                            !is_bad_name2(b_name,p_caption,search_str,b_url)
                    && (b1_success=true)) break;
                if(type==="email" && (mtch=p_caption.match(my_email_re))) {
                    for(j=0; j < mtch.length; j++) if(!MTurk.is_bad_email(mtch[j]) && mtch[j].length>0) my_query.email_list.push(mtch[j]);
                }
                if(type==="email") {
                    if(i>3) return null;
                    else if(!/\.(pdf|xls|xlsx|doc|docx)$/.test(b_url)&&!MTP.is_bad_url(b_url,bad_urls,-1)) promise_list.push(MTP.create_promise(b_url,contact_response,MTP.my_then_func,MTP.my_catch_func));
                    else if(/\.(pdf|xls|xlsx|doc|docx)$/.test(b_url) && MTP.get_domain_only(b_url)===my_query.domain) {
                        my_query.email_list.push(search_str.replace(/^\+\"(.*)\"$/,"$1"));
                    }
                }

            }

            if(b1_success && (resolve(b_url)||true)) return;
            if(type==="email") {
                Promise.all(promise_list).then(function() { resolve(""); })
                    .catch(function() { reject("Failed the email"); });
                return;
            }
        }
        catch(error) {
            reject(error);
            return;
        }
        if(parsed_context&&parsed_context.url&&parsed_context.url.length>0 &&
           !MTP.is_bad_url(parsed_context.url,bad_urls,-1) &&
           (resolve(parsed_context.url)||true)) return;
        if(parsed_lgb&&parsed_lgb.url&&parsed_lgb.url.length>0 &&(resolve(parsed_lgb.url)||true)) return;
        else if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.short_name+" "+my_query.city+" "+reverse_state_map[my_query.state]+" ",resolve,reject,query_response,"url");
            return;
        }
        else reject("No govt website found");
        //        GM_setValue("returnHit",true);
        return;

    }




    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type,search_str); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }


    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("Success, query_promise_then, result="+result);
        my_query.url=result;
        my_query.domain=MTP.get_domain_only(result,true);
       var curr;
        var type_list=[/Fire/i,/Sheriff/i,/Police|((^|[^A-Za-z]+)PD($|[^A-Za-z]+))/i,/Marshal/i]
        var dept_regex_lst=[/^((City|Town|Village) )?(Government|Department)$/i,
                            /Information Systems|Public Safety/i,/(^|[^A-Za-z]+)(PR|IT)($|[^A-Za-z]+)/i,
                            /Command Staff|Sheriff|Law Enforcement/i,
                            /(^|[^A-Za-z]+)(Tech|Communication)/i,/Message .*Chief/i,
                            /^(Public Information|(Information$))/i,/(Boro(ugh)?|Town|Village|Township|City) Hall/i];
        for(curr of type_list) {
            if(curr.test(my_query.agency_type)) dept_regex_lst.push(curr);
        }
        var title_regex_lst=[/Admin|Administrator|Sheriff|Supervisor|Manager/i,/(^|[^A-Za-z]+)(Technology|CTO|IT|Network)($|[^A-Za-z]+)/i,/Communication|Community/i,
                             /(^|[^A-Za-z]+)(PR)($|[^A-Za-z]+)/i,/Relations|Information Officer/i,/Clerk|Records|Recorder|PIO/i,
                            /Police Chief|^Chief$|Chief of Police|Chief of Public Safety|^Police Commissioner|Marshal/];
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:debug};
        var promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            GM_setValue("returnHit"+MTurk.assignment_id,true) },query);
    }

    var contact_response=function(doc,url,resolve,reject,query) {
        console.log("in contact_response,url="+url);
        var i,j, my_match,temp_email,encoded_match,match_split;

        var begin_email=my_query.fields.email,clicky;
        var x,scripts=doc.scripts,style=doc.querySelectorAll("style");
        //for(x=0;x<scripts.length;x++) { scripts[x].innerHTML=""; }
        for(x=0;x<style.length;x++) { style[x].innerHTML=""; }

        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        MTP.fix_emails(doc,url);
        console.log("& doc.body.innerHTML.length="+doc.body.innerHTML.length);
        if(doc.body.innerHTML.length>1000000) {
            console.log("Page at url="+url+", too long, resolving");
            resolve(query);
            return;
        }


        console.time("beforeemailmatchesnew");

        if((email_matches=doc.body.innerHTML.match(my_email_re))) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0) my_query.email_list.push(email_matches[j].toString());
            }
        }
        console.timeEnd("beforeemailmatchesnew");
        for(i=0; i < links.length; i++) {
            try {
                if((temp_email=links[i].href.replace(/^\s*mailto:\s*/,"").match(email_re)) &&
                   !MTP.is_bad_email(temp_email[0])) my_query.email_list.push(temp_email.toString());
                //else if(encoded_match) { console.log("encoded_match="+encoded_match); }
                //else if((clicky=links[i].getAttribute("onclick"))) { console.log("clicky="+clicky+", match="+clicky.match(/mailme/)); }
            }
            catch(error) { console.log("Error with emails "+error); }
        }
        console.log("* doing doneQueries++ for "+url);

        resolve(query);
        return;
    };

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
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
        console.log("my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    /* ASOC stuff, maybe expand later */
    var ASOC={};
    ASOC.type_lists={"Records":{lst:[],num:'3'},"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}};
    ASOC.agency_regex={"Police":/Police|(^|[^A-Za-z]+)PD($|[^A-Za-z]+)/i};
    /* After the Gov search */
    function gov_promise_then(my_result) {
        var i,curr,fullname,x,num;
        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
        for(i=0;i<result.length;i++) {
            if((!Gov.phone || Gov.phone.length===0) && result[i].phone && result[i].phone.length>0) Gov.phone=result[i].phone;
        }
        for(i=0;i<result.length;i++) {
            temp=new PersonQual(result[i]);
            console.log("("+i+"), "+JSON.stringify(temp));
            if(temp.quality>0&&ASOC.type_lists[temp.type]!==undefined) {
                ASOC.type_lists[temp.type].lst.push(temp); }
        }
        for(x in ASOC.type_lists) {
            ASOC.type_lists[x].lst.sort(cmp_people);
            console.log("ASOC.type_lists["+x+"]="+JSON.stringify(ASOC.type_lists[x]));
            if(ASOC.type_lists[x].lst.length>0) {
                console.log("Good type_list "+x);
                curr=ASOC.type_lists[x].lst[0];
                console.log("Good type_list "+x+"="+curr);
                num=ASOC.type_lists[x].num;
                if(curr.email==="na" && my_query.default_email) curr.email=my_query.default_email;
                insert_ASOC_PersonQual(curr,num);
                if(curr.email==="na" && num!=="3") {
                    /* Search for it */
                    my_query.done.email=false;
                    console.log("Beginning email_search for "+curr);
                    const emailPromise = new Promise((resolve, reject) => {
                        begin_email_search(curr,num,resolve,reject,0);
                    });
                    emailPromise.then(email_promise_then)
                        .catch(function(val) {
                        console.log("Failed at this emailPromise " + val);  });

                }

            }
            console.log("Done x");
        }
        my_query.done.gov=true;
        submit_if_done();

//        console.log("result="+JSON.stringify(result));
    }
    function good_init(str) {
            return str.length>0?str.charAt(0):"";
        }
    /* Do the email searches */
    function begin_email_search(curr,num,resolve,reject) {
        var promise_list=[];
        var fullname=MTP.parse_name(curr.name);
        curr.fullname=fullname;
        var search_str,x;

        for(x in fullname) fullname[x]=fullname[x].toLowerCase();
        if(!fullname.mname) fullname.mname="";
        /* Search for jsmith@domain.com OR smithj@domain.com, first.last@domain.com,firstlast@domain.com */
        var search_str_lst=["+\""+fullname.fname.charAt(0)+fullname.lname+"@"+my_query.domain+"\"",
            "+\""+fullname.lname+fullname.fname.charAt(0)+"@"+my_query.domain+"\"",
                           "+\""+fullname.fname+"."+fullname.lname+"@"+my_query.domain+"\"",
                            "+\""+fullname.fname+fullname.lname.charAt(0)+"@"+my_query.domain+"\"",
                             "+\""+fullname.fname.charAt(0)+good_init(fullname.mname)+fullname.lname+"@"+my_query.domain+"\"",
                            "+\""+fullname.lname+fullname.fname.charAt(0)+good_init(fullname.mname)+"@"+my_query.domain+"\""
                           ];
        var currPromise;
        var i=0;
        function do_email_search(search_str,resolve,reject,i) {
            setTimeout(function() { query_search(search_str, resolve, reject, query_response,"email"); },(i*1000));
        }
        for(search_str of search_str_lst) {

            currPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                do_email_search(search_str,resolve,reject,i);

            });
            currPromise.then(MTP.my_then_func)
                .catch(function(val) {
                console.log("Failed at this emailPromise " + val); });
            promise_list.push(currPromise);
                i++;
        }
        Promise.all(promise_list).then(function() { resolve(curr); }).catch(reject);



        console.log("new search_str="+search_str);

    }
    function assign_email(curr) {
        var domain_list=[];
        var fname=curr.fullname.fname,lname=curr.fullname.lname,mname=curr.fullname.mname;
        var dom_str=my_query.domain.replace(/\./g,"\\.");
        var email_regexps=
            [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"@"+dom_str,"i"),
             new RegExp("^"+fname+"[\\._]{1}"+lname+"@"+dom_str,"i"),
             new RegExp("^"+fname+lname.charAt(0)+"@"+dom_str,"i"),new RegExp("^"+lname+fname.charAt(0)+"@"+dom_str,"i"),
             new RegExp("^"+good_init(fname)+good_init(mname)+lname+"@"+dom_str,"i")];
        var curr_email,curr_re;
        for(curr_email of my_query.email_list) {
            for(curr_re of email_regexps) {
                if(curr_re.test(curr_email)) {
                    curr.email=curr_email;
                }
            }
            if(curr_email.indexOf(my_query.domain)!==-1) console.log("curr_email="+curr_email);
            return;
        }


    }
    function update_ASOC() {
        var x,curr,num;
        for(x in ASOC.type_lists) {
            ASOC.type_lists[x].lst.sort(cmp_people);
            console.log("ASOC.type_lists["+x+"]="+JSON.stringify(ASOC.type_lists[x]));
            if(ASOC.type_lists[x].lst.length>0) {

                curr=ASOC.type_lists[x].lst[0];
                console.log("Good type_list "+x+"="+curr);
                num=ASOC.type_lists[x].num;
                if(curr.email==="na" && x==="Administration"&&my_query.default_email) curr.email=my_query.default_email;
                if(curr.phone==="na" && x==="Administration"&&my_query.default_phone) curr.phone=my_query.default_phone;
                insert_ASOC_PersonQual(curr,num);
            }
            console.log("Done x");
        }
    }
    function email_promise_then(curr_name) {
        console.log("curr="+JSON.stringify(curr_name));
        assign_email(curr_name);
        var x,curr,num;
        console.log("my_query.email_list="+JSON.stringify(my_query.email_list));
        my_query.done.email=true;
        update_ASOC();
        submit_if_done();
    }

    /* insert PersonQual into ASOC */
    function insert_ASOC_PersonQual(curr,num) {
        var fullname=MTP.parse_name(curr.name);
        my_query.fields["f"+num+"2"]=fullname.fname;
        my_query.fields["f"+num+"3"]=fullname.lname;
        my_query.fields["f"+num+"1"]=curr.title;
        if(curr.phone) my_query.fields["f"+num+"4"]=curr.phone;
        else my_query.fields["f"+num+"4"]="na";
        if(curr.email) my_query.fields["f"+num+"5"]=curr.email;
        else my_query.fields["f"+num+"5"]="na";
    }






    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var terms=["name","title","phone","email"],x;
        var admin_re_lst=[{type_re:/Fire/i,admin_re:/^Fire/i},{type_re:/Sheriff/i,admin_re:/(^|[^A-Za-z]+)(Sheriff)/i},
                          {type_re:/Police/i,
                           admin_re:/^(Chief)$|Police Chief|Public Safety|Chief of Police|Director of Public Safety|Police Commissioner/i},
                          {type_re:/Constable/i,admin_re:/^Constable/i},
                          {type_re:/Marshal/i,admin_re:/\s*Marshal/i}];
        var admin_re=/Director|Manager|Coordinator/;
        for(x of admin_re_lst) {
            if(x.type_re.test(my_query.agency_type)) {
                admin_re=x.admin_re;
                break;
            }
        }
       // console.log("admin_re="+admin_re);
        curr.name=curr.name.trim();
        for(x of terms) this[x]=curr[x]?curr[x]:"na";
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.phone) {
            let p_match=this.phone.match(phone_re);
            this.phone=p_match?p_match[0]:"";
        }
        if(this.name) {
            fullname=MTP.parse_name(curr.name);
            this.first=fullname.fname;
            this.last=fullname.lname;
        }
        if(this.email) this.email=this.email.replace(/This email address is being protected from spambots\. You need JavaScript enabled to view it\.(.*@.*)cloak.*$/,"$1");
        let email_match;
        if(this.email && (email_match=this.email.match(email_re))) this.email=email_match[0];
        if(this.email==="Email" && Gov.id==="granicus"&&this.first
           &&this.last) this.email=this.first.toLowerCase().charAt(0)+this.last.toLowerCase()+"@"+MTP.get_domain_only(Gov.url,true);

        if((!this.phone ||this.phone==="na") && Gov.phone) this.phone=Gov.phone;
        if(!this.phone||!this.phone.trim()) this.phone="na";
        this.quality=0;
        this.type="";
        if(curr.title && admin_re.test(curr.title)) {
            this.type="Administration";
            if(/^(Chief|Chief of Police|Police Chief)$/i.test(curr.title)) this.quality=4;
            else if(/Chief Administrative Officer/.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if((curr.title && /((^|[^A-Za-z]+)(IT|GIS)($|[^A-Za-z]+))|Information Technology|Technology|Information/i.test(curr.title))||
          (curr.department && /((^|[^A-Za-z]+)IT($|[^A-Za-z]+))|Information Technology|Technology/i.test(curr.department))
          ) {
            this.type="IT";
            if(/^(IT Director|Technology Director|Chief Technology Officer|CTO|Technology Coordinator|Chief Information Officer|Director of Information Technology)$/i
               .test(curr.title)) this.quality=4;
            else if(/Director|Chief|Specialist/.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if((curr.title && !(this.type==="Administration") && /(Communica)|(Public Rel)|Public Information|((^|[^A-Za-z]+)(PR|PIO)($|[^A-Za-z]+))/i.test(curr.title)) || (curr.department && /Communications/.test(curr.department))) {
            this.type="Communication";
            if(/^(Communications Director|Public Relations Director|Communications Manager|Public Information Officer|PIO)$/i
               .test(curr.title)) this.quality=4;
            else if(/Director|Manager/.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if(curr.title && !(this.type==="Administration") && /Clerk|Record|(^(City|Town|Village)\s+Secretary$)/i.test(curr.title)&&
           !/Clerk of (the )?court/i.test(curr.title)&&!/Court/.test(curr.title)) {
            this.type="Records";
            if(/^(Clerk|((City|Boro(ugh)?|Town|Municipal|Township|Village|County) (Clerk|Recorder|Record Officer|Clerk\/Treasurer)))$/i
               .test(curr.title)) this.quality=7;
            else if(/((Municipal|City|Boro(ugh)?|Town|Township|Village|County) Clerk|Recorder|Record Officer)/i
               .test(curr.title)) this.quality=5;
            else if(/^Clerk/i.test(curr.title)) this.quality=4.1;
            else if(/Clerk/i.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if(this.email!=="na"||email_re.test(this.email)) this.quality+=.01
        if(/[\d\?]+|Downstream/.test(this.name)) this.quality=-1;
        if(this.is_bad_person_name(this.name)) this.quality=-1;
        var nlp_out=nlp(this.name).people().out('topk');
        if(nlp_out.length>0) this.quality+=2;
        if(curr.quality) this.quality=curr.quality; // manually set quality
    }
    PersonQual.prototype.toString=function() {
        return "{ Name:"+this.name+", Title: "+(this.title)+", Phone: "+
            (this.phone)+", Email: "+this.email+", Department: "+this.department+"}";
    };
    PersonQual.prototype.is_bad_person_name=function(name) {
        if(/\s+(Pike|Rd\.|Road|St\.?|Street$)/i.test(name)) return true;
        if(/(^|[^A-Za-z]+)(Monday|Friday|Library|Sheriff\'s|Administration|Ave\.?|Apply|Hours|Sign In|P\.?O\.? Box|Borough|Office|Government|Mayor|Our|Services)($|[^A-Za-z]+)/i.test(name)) return true;
  if(/(^|[^A-Za-z]+)(Click|Here|Contact)($|[^A-Za-z]+)/i.test(name)) return true;
        if(/PO Box/.test(name)) return true;
        if(name.split(/\s+/).length>4) return true;

        return false;
    };

     function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

    function paste_data(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/1$/,"");
        var term_list=["","Tech Coordinator","Sheriff","Clerk"];
        var text = e.clipboardData.getData("text/plain");
        var ret=Gov.parse_data_func(text),fullname;
        if(text==="na") {
            ret={"first":"na","last":"na","title":"na","phone":"na","email":"na"};
        }
        console.log("ret="+JSON.stringify(ret));
        var term_map={"title":"1","first":"2","last":"3",phone:"4",email:"5"},x;
        if(ret) {
            if(ret.name) {
                fullname=MTP.parse_name(ret.name);
                ret.first=fullname.fname;
                ret.last=fullname.lname;
            }
            if(ret.phone) ret.phone=ret.phone.replace(/^([\d]{3}\))/,"($1");
            if(ret.email) ret.email=ret.email.replace(/^20/,"");
            if(ret.title===undefined||ret.title.length===0)  {
                let num=target_type.replace(/^f/,"").replace(/^$/,"0");
                console.log("target_Type="+num+", elem="+parseInt(num));
                ret.title=term_list[parseInt(num)];
            }
            for(x in term_map) {
                if(ret[x]!==undefined) document.getElementById(target_type+term_map[x]).value=ret[x];
            }
        }
        else e.target.value=text;
    }
    function paste_name(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/2$/,"");
        var text = e.clipboardData.getData("text/plain");
        var ret=MTP.parse_name(text.trim());

        var term_map={"fname":"2","lname":"3"},x;
        if(ret&&ret.fname) {

            for(x in term_map) {
                if(ret[x]!==undefined) {
                    my_query.fields[target_type+term_map[x]]=ret[x];
                    document.getElementById(target_type+term_map[x]).value=ret[x];
                }
            }
        }
        else e.target.value=text;
    }

    function set_govt_names() {
        var agency_match;
        var agency_type_list=[{re:/(^|[^A-Za-z]+)Police($|[^A-Za-z]+)/,name:"Police"}],ag;
        my_query.orig_name=my_query.orig_name.replace(/Township of ([^,]*)/,"$1 Township").replace(/charter Township/,"Township");
        my_query.agency_name=my_query.orig_name.replace(/\([^\)]+\)/,"").trim().replace(/[A-Z]{2}$/,function(match, offset, string) {
            if(reverse_state_map[match]!==undefined) return reverse_state_map[match];
            else return match;
        });
        my_query.query_name=my_query.orig_name.replace(/\sCO\)/," County").replace(/[\(\)]+/g,"")
            .trim().replace(/[A-Z]{2}$/,function(match, offset, string) {
            if(reverse_state_map[match]!==undefined) return reverse_state_map[match];
            else return match;
        });


    //    console.log("New my_query.agency_name="+my_query.agency_name);
        agency_match=my_query.agency_name.match(/(.*)\s-\s*([^,]*),\s*(.*)$/);
        if(agency_match) my_query.agency_type=agency_match[2].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");
        else if((agency_match=my_query.agency_name.match(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/)))
        {
            my_query.agency_type=agency_match[3].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");
        }
        else {
            for(ag of agency_type_list) {
                if(ag.re.test(my_query.agency_name)) my_query.agency_type=ag.name; }
        }



        my_query.query_name=my_query.query_name.replace(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/,"$1 $3 $2");
        my_query.query_name=my_query.query_name.replace(/(^|\s)(?:Community|Central )School Corporation(\s|,|$)/,"$1Schools$2").trim();
        my_query.query_name=my_query.query_name.replace(/(^|\s)[\dR]+-([XVI\d]+)(\s|$|,)/,"")
        .replace(/School District[^,]*,/,"School District,")
        .replace(/Charter Township,/,"Township,");
        my_query.query_name=my_query.query_name.replace(/(^|\s)Union Free(\s|$)/," ").trim();

        console.log("my_query.query_name="+my_query.query_name);

        my_query.agency_name=my_query.agency_name.replace(/(.*)\s-\s([^,]*),\s*(.*)$/,"$1, $3 $2");
        my_query.agency_name=my_query.agency_name.replace(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/,"$1, $2 $3");
        my_query.agency_name=my_query.agency_name.replace(/(^|\s)(City|Town|Village|Borough)(\sof)(\s|$)/i," ")
        .replace(/Charter Township,/,"Township,");
       // console.log("New my_query.agency_name="+my_query.agency_name);

        my_query.short_name=my_query.agency_name.replace(/,.*$/,"")
         my_query.short_name=my_query.short_name.replace(/Marshal(?:\'?s)(\s|$)(Office(\s|$))?/,"");
        my_query.short_name=my_query.short_name.replace(/\s*Township/,"");
        my_query.short_name=my_query.short_name.replace(/\s(Supervisory )?Union($|,)/,"");
        my_query.short_name=my_query.short_name.replace(/(((Area )?Public|Community|Consolidated) )?Schools$/,"");
        my_query.short_name=my_query.short_name.replace(/(?:(?:Union(?: Elementary))|Regional) School District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1");
        my_query.short_name=my_query.short_name.replace(/(?:(?:Union Free|Exempted Village|Unified|Local|Consolidated Independent|Independent|Community Unit|Community Consolidated|Central|County|Joint|Community|Public|Metropolitan|Reorganized|Elementary|City|High|(?:Community(?: High)?)) )?School District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1")

            .replace(/(?:(?:Unified|Regional|Independent|Central|County|Public|Metropolitan|Reorganized|Elementary|High(?:Community(?: High)?)) )?District(?:(?:\s\d+))?(\s|$)[^,]*/,"$1")
.replace(/(\s)K-12/,"$1")
            .trim();
        my_query.short_name=my_query.short_name.replace(/Charter( Elementary)? School/i,"");
         my_query.short_name=my_query.short_name.replace(/((Public|Community) )?Schools$/,"");
        my_query.short_name=my_query.short_name.replace(/(^|\s)[R\d]{1}-[-A-Z\d]+(\s|$)/," ")
        .replace(/(^|\s)(City|Town|Village|County|Municipality|Township|Borough|(?:State )?University|Community College|College)(\sof)?(\s|$)/ig," ");
        my_query.short_name=my_query.short_name.replace(/(?: Community) School Corporation(\s|$)/,"$1");
        my_query.short_name=my_query.short_name.replace(/\sSchool System$/,"");

        my_query.short_name=my_query.short_name.trim();


        my_query.short_name=my_query.short_name.replace(/(^|\s)\([^\)]+\)(\s|$)/,"");
         my_query.short_name=my_query.short_name.trim();
    }

    /* doing fb */
    function fb_promise_then(result) {
        var url=result.replace(/m\./,"www.");
        url=url.replace(/facebook\.com\/pages\/([^\/]*)\/([^\/]*)/,"facebook.com/$1-$2");
        url=url.replace(/facebook\.com\/([^\/]+).*$/,"facebook.com/pg/$1").replace(/\/$/,"")+"/about/?ref=page_internal";
        my_query.fb_url=url;
        console.log("FB promise_then, new url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_about_then);

    }

     function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));

        my_query.done.fb=true;

        if(result.email) {
            my_query.default_email=result.email;
            var p=new PersonQual({name:result.team.length>0?result.team[0]:"",title:"Chief",phone:result.phone||"",email:result.email,quality:1.01});
            ASOC.type_lists["Administration"].lst.push(p);
            update_ASOC();
        }
         if(result.phone) {
             my_query.default_phone=result.phone;
     }
        else {
            console.log("Calling submit_if_done from parse_fb_about_then");
        }

         submit_if_done();

    }

    function init_Query()
    {
        console.log("in init_query");
        bad_urls=bad_urls.concat(default_bad_urls);
        var i;
        var agency_match;

        var ctrl=document.querySelectorAll(".form-control");
        ctrl.forEach(function(elem) { elem.value="na"; });
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:wT.rows[0].cells[1].innerText,city:wT.rows[1].cells[1].innerText,county:wT.rows[2].cells[1].innerText,
                  state:wT.rows[3].cells[1].innerText,agency_type:"",agency_number:"",email_list:[],domain:"",
                  fields:{"f1":"",f2:"",f3:"",f4:"",f5:"",f11:"",f12:"",f13:"",f14:"",f15:"",f21:"",f22:"",f23:"",f24:"",f25:"",
                         f31:"",f32:"",f33:"",f34:"",f35:""},
                  done:{fb:false,gov:false},submitted:false,try_count:{"query":0}};

        my_query.orig_name=my_query.name;
        my_query.agency_name=my_query.orig_name;
        my_query.city=my_query.city.replace(/No\.\s/,"North ")
        .replace(/^([A-Z]{1})(.*)$/,function(match,p1,p2) {

            console.log("match="+match+", p1="+p1+", p2="+p2);
            return p1+p2.toLowerCase(); });


        set_govt_names();
        // Should never happen now
       

       // .replace(/(^|\s)of(\s|$)/i,"");
       // console.log("my_query="+JSON.stringify(my_query));
        my_query.agency_type=my_query.agency_type.replace(/Sherrif/,"Sheriff");
        console.log("my_query="+JSON.stringify(my_query));
        for(i in my_query.fields) my_query.fields[i]="na";
        var title_lst=["","1","2"];
        for(i=0;i<title_lst.length;i++) {
            document.querySelector("#f"+title_lst[i]+"1").addEventListener("paste",paste_data);
            document.querySelector("#f"+title_lst[i]+"2").addEventListener("paste",paste_name);
        }
        Gov.debug=true;

         if(/ - /.test(my_query.agency_name)) {
            console.log("Agency contains -, returning");

            GM_setValue("returnHit"+MTurk.assignment_id,true); return; }

        var search_str=my_query.query_name+"";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        var fb_search_str=my_query.query_name+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(fb_search_str, resolve, reject, query_response,"fb");
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });



    }

})();