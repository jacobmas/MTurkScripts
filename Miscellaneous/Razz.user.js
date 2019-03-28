// ==UserScript==
// @name         Razz
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @require https://raw.githubusercontent.com/adamhooper/js-priority-queue/master/priority-queue.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    var my_query = {};
    var bad_urls=["facebook.com"];
    var MTurk=new MTurkScript(30000,200,[],begin_script,"A1LMQ3C2A5F1RL",true);
    var MTP=MTurkScript.prototype;
    function check_function()
    {
        return true;
    }

    function is_bad_email(email)
    {
        if(email.indexOf("@example.com")!==-1 || email.indexOf("@email.com")!==-1 || email.indexOf("@domain.com")!==-1) return true;
        return false;
    }

    function is_bad_name(b_name,p_caption,i)
    {
        console.log("b_name="+b_name);
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        if(i===0 && b_name.toLowerCase().indexOf(my_query.name.split(" ")[0].toLowerCase())!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        if(b_name.trim().toLowerCase()===my_query.name.trim().toLowerCase()) return false;

        return true;
    }


    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,parsedAdd,loc_hy,parsed_loc;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(type==="url" && b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.Address) {
                    parsedAdd=parseAddress.parseLocation(parsed_context.Address);
                    my_query.fields["Street Address"]=parsed_context.Address.replace(/,[^,]+,[^,]+$/,"");
                    if(parsedAdd&&parsedAdd.zip) my_query.fields.zip=parsedAdd.zip;
                    add_to_sheet();
                }
                if(type==="url" && parsed_context.url && !MTP.is_bad_url(parsed_context.url,bad_urls) && (resolve(parsed_context.url)||true)) return;
                else if(type==="url" && parsed_context.url && /facebook/.test(parsed_context.url)) {
                    fb_promise_then(parsed_context.url);
                    my_query.done.fb=false; }

            }
            if(type==="url" &&lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            if(type==="url" && loc_hy && (parsed_loc=MTP.parse_loc_hy(loc_hy))) {
                if(parsed_loc.address) {
                    parsedAdd=parseAddress.parseLocation(parsed_loc.address);
                    my_query.fields["Street Address"]=parsed_loc.address.replace(/,[^,]+,[^,]+$/,"");
                    if(parsedAdd&&parsedAdd.zip) my_query.fields.zip=parsedAdd.zip;
                    add_to_sheet();
                }
                if(parsed_loc.url && (resolve(parsed_context.url)||true)) return;
            }
            for(i=0; i < b_algo.length&&i<6; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/bizapedia\.com/.test(b_url)) {
                    my_query.bizapedia_url=b_url;
                    my_query.done.bizapedia=false;
                    var promise=MTP.create_promise(my_query.bizapedia_url,parse_bizapedia,parse_bizapedia_then);
                }

                if(type==="url" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2)
                   && !/\?[a-z]+\=/.test(b_url)
                   && !is_bad_name(b_name,p_caption,i) && (b1_success=true)) break;
                else if((type==="companies_number"||type==="corpwiki")&& !is_bad_name(b_name.replace(/, C[\d]+ -.*$/,"")

                                                                ,p_caption,i) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(type==="url" && my_query.try_count===0) {
            my_query.try_count++;

            query_search(my_query.name+" "+my_query.city+" "+my_query.state,resolve,reject,query_response,type);
            return;
        }
        else if(type==="url" && my_query.try_count===1) {
            my_query.try_count++;

            query_search((my_query.dba.trim().length>0?my_query.dba.trim():my_query.name+" marijuana ")+" "+my_query.city+" "+my_query.state,
                         resolve,reject,query_response,type);
            return;
        }

        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("try_count: "+my_query.try_count+", Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.fields.website=result;
        add_to_sheet();
        call_contact_page(result,submit_if_done);
    }

    function comnum_promise_then(result) {
        console.log("comnum_promise_then, result="+result);
        var promise=MTP.create_promise(result,parse_comnum,parse_comnum_then);
    }
    function parse_comnum(doc,url,resolve,reject) {
        console.log("parse_comnum,url="+url);
        var table=doc.querySelector("table.table"),i,row,match;
        if(!table && (resolve("")|true)) return;
        for(i=0;i<table.rows.length;i++) {
            row=table.rows[i];
            if(row.length<2) continue;
            if(/Street Address/.test(row.cells[0].innerText)) my_query.fields["Street Address"]=row.cells[1].innerText.trim();
            if(/State Zip Code/.test(row.cells[0].innerText) &&
              (match=row.cells[1].innerText.trim().match(/[\d\-]+$/))) my_query.fields.zip=match[0];
        }
        resolve("");
    }
    function parse_comnum_then(result) {

        my_query.done.companies_number=true;
        submit_if_done();
    }

    function corpwiki_promise_then(result) {
        console.log("corpwiki_promise_then, result="+result);
        var promise=MTP.create_promise(result,parse_corpwiki,parse_corpwiki_then);
    }
    function parse_corpwiki(doc,url,resolve,reject) {
        console.log("parse_corpwiki,url="+url);
        var itemschema=doc.querySelectorAll("[itemprop='address']"),add,zip,i,city;
        for(i=0;i<itemschema.length;i++) {
            console.log("itemschema["+i+"]="+itemschema[i].innerText);
            if(!(city=itemschema[i].querySelector("[itemprop='addressLocality']")) || (city.innerText!==my_query.city))
            {
                console.log("city.innerText="+city.innerText);
                continue;
            }
            if(add=itemschema[i].querySelector("[itemprop='streetAddress']")) my_query.fields["Street Address"]=add.innerText;
            if(zip=itemschema[i].querySelector("[itemprop='postalCode'] ")) my_query.fields.zip=zip.innerText;

        }
        add_to_sheet();
        resolve("");
    }
    function parse_corpwiki_then(result) {

        my_query.done.corpwiki=true;
        submit_if_done();
    }



    function parse_bizapedia(doc,url,resolve,reject) {
        var itemschema=doc.querySelector("[itemtype='https://schema.org/PostalAddress']"),add,zip;
        if(!itemschema && (resolve("")|true)) return;
        if(add=itemschema.querySelector("[itemprop='streetaddress' i]")) my_query.fields["Street Address"]=add.innerText;
        if(zip=itemschema.querySelector("[itemprop='postalcode' i] ")) my_query.fields.zip=zip.innerText;
        add_to_sheet();
        resolve("");
    }
    function parse_bizapedia_then(result) {
        my_query.done.bizapedia=true;
        submit_if_done(); }



    /* Following the finding the district stuff */
    function fb_promise_then(url) {
        my_query.fb_url=url;
        my_query.fb_url=my_query.fb_url.replace(/(https?:\/\/[^\/]*\/[^\/]*).*$/,"$1/about/?ref=page_internal")
        console.log("my_query.fb_url="+my_query.fb_url);
        GM_setValue("fb_url",my_query.fb_url);
    }

    function add_to_sheet() {
        var x,field
        for(x in my_query.fields) {
            if((field=document.getElementsByName(x)[0]) && my_query.fields[x].length>0) {
                field.value=my_query.fields[x];

            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
         if(MTurk.queryList.length>0 && MTurk.doneQueries>=MTurk.queryList.length) {
            my_query.done["url"]=true; }
        console.log("my_query="+JSON.stringify(my_query)+"\ndoneQueries="+MTurk.doneQueries+", total="+MTurk.queryList.length);
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;

        console.log("is_done="+is_done+", MTurk.queryList.length="+MTurk.queryList.length);
        if(is_done && MTurk.doneQueries>=MTurk.queryList.length&&
           !my_query.submitted && (my_query.submitted=true)) {
            if(my_query.fields.email.length===0) {
                console.log("no email found, returning");
                GM_setValue("returnHit",true);
                return;
            }
            MTurk.check_and_submit(); }
    }
    /* Call contact_page works with contact_response */
    var call_contact_page=function(url,callback,extension) {
        console.log("in call_contact_page, url="+url+", extension="+extension);
        if(extension===undefined || extension==='') { extension='';
                                   MTurk.queryList.push(url); }
        GM_xmlhttpRequest({method: 'GET', url: url,onload: function(response) {
            var doc = new DOMParser().parseFromString(response.responseText, "text/html");
            contact_response(doc,response.finalUrl,{extension:extension,callback:callback}); },
                           onerror: function(response) { console.log("Fail");
                                                       // if(extension==='') my_query.fields.email="none@none.com";
                                                        MTurk.doneQueries++;
                                                        callback(); },
                           ontimeout: function(response) { console.log("Fail timeout");
                                                          MTurk.doneQueries++;
                                                          callback(); }
                          });
    };


    /**
 * contact_response Here it searches for an email TODO:FIX */
    var contact_response=function(doc,url,extra) {
        console.log("in contact_response,url="+url);
       // console.log("doc.body.innerHTML="+doc.body.innerHTML);
        var i,j, my_match,temp_email,encoded_match,match_split;
        var extension=extra.extension,callback=extra.callback;
        var begin_email=my_query.fields.email;
        if(extension===undefined) extension='';

        console.log("in contact_response "+url);
        var short_name=url.replace(my_query.url,""),links=doc.links,email_matches,phone_matches;
        var replacement=url.match(/^https?:\/\/[^\/]+/)[0];
        var contact_regex=/(Contact|About|Legal|Team|Coach|Terms)/i,bad_contact_regex=/^\s*(javascript|mailto):/i;
        console.log("replacement="+replacement);
        var temp_url,curr_url;
        doc.body.innerHTML=doc.body.innerHTML.replace(/\s*\[at\]\s*/,"@").replace(/\s*\[dot\]\s*/,".");
        if(email_matches=doc.body.innerHTML.match(email_re)) {
            for(j=0; j < email_matches.length; j++) {
                if(!MTurk.is_bad_email(email_matches[j]) && email_matches[j].length>0 &&
                   (my_query.fields.email=email_matches[j])) break;
            }
            console.log("Found email hop="+my_query.fields.email);
        }
        if(phone_matches=doc.body.innerText.match(phone_re)) my_query.fields.phoneNumber=phone_matches[0];
        for(i=0; i < links.length; i++)
        {
            if(my_query.fields.email.length>0) break;

             //console.log("i="+i+", text="+links[i].innerText);
            if(extension==='' && contact_regex.test(links[i].innerText) && !bad_contact_regex.test(links[i].href) &&
               !MTurk.queryList.includes(links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url)))
            {
                MTurk.queryList.push(links[i].href);
                console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                call_contact_page(links[i].href,callback,"NOEXTENSION");
                continue;
            }
            if(links[i].dataset.encEmail && (temp_email=MTurkScript.prototype.swrot13(links[i].dataset.encEmail.replace(/\[at\]/,"@")))
               && !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("cdn-cgi/l/email-protection#")!==-1 && (encoded_match=links[i].href.match(/#(.*)$/)) &&
               (temp_email=MTurkScript.prototype.cfDecodeEmail(encoded_match[1]).replace(/\?.*$/,"")) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email)) my_query.fields.email=temp_email;
            if(links[i].href.indexOf("javascript:location.href")!==-1 && (temp_email="") &&
               (encoded_match=links[i].href.match(/String\.fromCharCode\(([^\)]+)\)/)) && (match_split=encoded_match[1].split(","))) {
                for(j=0; j < match_split.length; j++) temp_email=temp_email+String.fromCharCode(match_split[j].trim());
                my_query.fields.email=temp_email;
            }
            if(links[i].href.indexOf("javascript:DeCryptX(")!==-1 &&
               (encoded_match=links[i].href.match(/DeCryptX\(\'([^\)]+)\'\)/))) my_query.fields.email=MTurkScript.prototype.DecryptX(encoded_match[1]);
            if(/^tel:/.test(links[i].href)) my_query.fields.phoneNumber=links[i].href.replace(/^tel:/,"");
            if(/instagram\.com/.test(links[i].href) && my_query.done["insta"]===undefined) {
                my_query.done["insta"]=false;
                console.log("***** FOUND INSTAGRAM "+links[i].href);
                var temp_promise=MTP.create_promise(links[i].href,MTP.parse_instagram,parse_insta_then); }
        }
        console.log("* doing doneQueries++ for "+url);
        MTurk.doneQueries++;
        //add_to_sheet();
        //submit_if_done();
        //if(begin_email.length===0 && my_query.fields.email.length>0) my_query.fields.url=url;
        callback();
        return;
    };

  function parse_insta_then(result) {
        console.log("insta_result="+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; }
        my_query.done["insta"]=true;
        submit_if_done();
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback==undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function is_bad_fb_url(url) {
        return /\/(pages|groups|events)\//.test(url); }

    function parse_fb_about_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.email) { my_query.fields.email=result.email; my_query.done.fb=true; my_query.done.url=true; }
        if(result.url&&result.url.length>0 && my_query.url.length===0) my_query.url=result.url;
        my_query.done.fb=true;
        submit_if_done();
        if(my_query.fields.email.length===0&&my_query.url.length>0) {
            call_contact_page(my_query.url,submit_if_done,'');
            return;
        }
        else if(my_query.fields.email.length===0) {
            my_query.fields.email="";
            my_query.done.url=true;
            submit_if_done();
            return;
        }
    }

    function init_Query() {

        var i;
        var li=document.querySelectorAll("form li");
        var regex,match;
        my_query={
                  fields:{email:"","Street Address":"",phone:"",zip:"",website:""},
            done:{fb:true,url:false,bizapedia:true,companies_number:false,corpwiki:false},submitted: false,
        try_count:0};
        for(i=0;i<li.length;i++) {
           //console.log("li["+i+"].innerText="+li[i].innerText);
            if((match=li[i].innerText.match(/^Company Name:\s*(.*)/))) {
                my_query.name=MTP.shorten_company_name(match[1]);
                my_query.long_name=match[1]; }
            else if((match=li[i].innerText.match(/Phone:\s*([\d]{3})([\d]{3})([\d]{4})/))) my_query.fields.phone=match[1]+"-"+match[2]+"-"+match[3];
            else if((match=li[i].innerText.match(/Possible DBA[^:]*:\s*(.*)/))) my_query.dba=match[1];
            else if((match=li[i].innerText.match(/City, State:\s*([^,]+),\s*(.*)/))) {
                my_query.city=match[1];
                my_query.state=match[2];
            }
        }
        add_to_sheet();
        var inp=document.querySelectorAll("form input");
        for(i=0;i<inp.length;i++) {
           // console.log("inp["+i+"]="+inp[i].outerHTML);

            inp[i].required=false; }
        inp=document.querySelectorAll("form crowd-input");
        for(i=0;i<inp.length;i++) {
           // console.log("inp["+i+"]="+inp[i].outerHTML);

            inp[i].required=false; }

        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.long_name+" "+my_query.city+" "+my_query.state;//+" "+my_query.fields.phone;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"url");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.url=true; submit_if_done(); });

        search_str=my_query.long_name+"  site:companies-number.com";//+" "+my_query.fields.phone;
        const comnumPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"companies_number");
        });
        comnumPromise.then(comnum_promise_then)
            .catch(function(val) {
            console.log("Failed at this comnum_Promise " + val);
            my_query.done.companies_number=true;
            submit_if_done();
        });

        search_str=my_query.long_name+" "+my_query.city+" "+my_query.state+"  site:corporationwiki.com";//+" "+my_query.fields.phone;
        const corpwikiPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"corpwiki");
        });
        corpwikiPromise.then(corpwiki_promise_then)
            .catch(function(val) {
            console.log("Failed at this corpwikiromise " + val);
            my_query.done.corpwiki=true;
            submit_if_done();
        });






    }


})();