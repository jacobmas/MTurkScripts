// ==UserScript==
// @name         LawFirm
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Law Firm
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/0e0e0e4701dd2ec0324840833e3801a4918e584a/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A2PAYBI7MSZ2JC",true);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        var b_split=b_name.split(/\s+[\-\|]\s+/),i;
        for(i=0;i<b_split.length;i++) {
            if(my_query.fields.companyName.length>0 && MTP.matches_names(my_query.fields.companyName,b_split[i])) {
                console.log("matched "+my_query.fields.companyName+", "+b_split[i]);
                return false;
            }
        }

        return true;
    }

     function fb_query_response(response,resolve,reject) {
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
                console.log("parsed_context="+JSON.stringify(parsed_context));

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(true)
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }


    function query_response(response,resolve,reject) {
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace(/\/$/,"");
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/-f$/.test(b_url) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;
                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    function fb_promise_then(url) {
        url=url.replace(/m\.facebook/,"www.facebook").replace(/(facebook\.com\/[^\/]+).*$/,"$1");
        url=url.replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
        console.log("### facebook url="+url);
        var promise=MTP.create_promise(url,MTP.parse_FB_about,parse_fb_then,function() { my_query.done["fb"]=true; submit_if_done(); }); }

    function parse_fb_then(result) {
        console.log("result="+JSON.stringify(result));
        if(result.url && (MTP.get_domain_only(result.url.toLowerCase(),true)===MTP.get_domain_only(my_query.url.toLowerCase(),true))) {
            if(result.pageTitle) my_query.fields.companyName=result.pageTitle;
            if(result.phone) my_query.fields.phone=result.phone;
            if(result.email) my_query.fields.email=result.email;
            if(result.address && result.address.street&&result.address.city&&result.address.state&&!(result.address.street==="Fake"&&result.address.number==="123")) {
                my_query.fields.addressLine1=(result.address.number?result.address.number+" ":"")+
                    (result.address.street?result.address.street+" ":"")+(result.address.type?result.address.type+" ":"")+
                    (result.address.suffix?result.address.suffix+" ":"");
                my_query.fields.addressLine1=my_query.fields.addressLine1.trim();
                my_query.fields.city=result.address.city;
                my_query.fields.stateOrRegion=result.address.state;
                my_query.fields.zip=result.address.zip;
            }
        }
        my_query.fb.done=true;
        submit_if_done();
    }

    function yp_promise_then(url) {
        var promise=MTP.create_promise(url,parse_yellowpages,parse_yp_then,function() { my_query.done["yp"]=true; submit_if_done(); });
    }

    function parse_yellowpages(doc,url,resolve,reject) {
        if(!/mip/.test(url)) { parse_yp2(doc,url,resolve,reject); return; }
        var address=doc.querySelector(".address");
        var phone=doc.querySelector(".phone");
        var result={};
        if(address) result.address=address.innerText.replace(/\n/g,",");
        if(phone) result.phone=phone.innerText;
        resolve(result);
    }
    function parse_yp2(doc,url,resolve,reject) {
        var div=doc.querySelector(".srp-listing.mdm"),adr,phone,street,new_url;
        var result={};

        if(div) {
            if((new_url=div.querySelector(".track-visit-website"))) result.url=new_url.href;
            if((adr=div.querySelector(".adr"))) result.address=adr.innerText.replace(/\n/g,",");
            if(street=div.querySelector(".street-address")) result.addressLine1=street.innerText;
            if(adr && street) result.address=result.address.replace(result.addressLine1,result.addressLine1+",");
        }
        if(div&&(phone=div.querySelector(".phone"))) result.phone=phone.innerText;
        resolve(result);

    }

    function parse_yp_then(result) {
        console.log("yp: result="+JSON.stringify(result));
        if(!result.url||(result.url&&MTP.get_domain_only(my_query.url.toLowerCase(),true)===MTP.get_domain_only(result.url.toLowerCase(),true)))
        {
            if(result.phone && my_query.fields.phone.length===0) { my_query.fields.phone=result.phone; }
            if(result.address && !(my_query.fields.addressLine1.length>0 && my_query.fields.city.length>0 &&
                                   my_query.fields.stateOrRegion.length>0 && my_query.fields.zip.length>0)) {
                var parsedAdd=parseAddress.parseLocation(result.address);
                console.log("parsedAdd="+JSON.stringify(parsedAdd));
                if(result.addressLine1) my_query.fields.addressLine1=result.addressLine1;
                else if(parsedAdd.street) {
                    my_query.fields.addressLine1=(parsedAdd.number?parsedAdd.number+" ":"")+
                        (parsedAdd.street?parsedAdd.street+" ":"")+(parsedAdd.type?parsedAdd.type+" ":"")+
                        (parsedAdd.suffix?parsedAdd.suffix+" ":"");
                    my_query.fields.addressLine1=my_query.fields.addressLine1.trim(); }
                if(parsedAdd.city) my_query.fields.city=parsedAdd.city;
                if(parsedAdd.state) my_query.fields.stateOrRegion=parsedAdd.state;
                if(parsedAdd.zip) my_query.fields.zip=parsedAdd.zip;
            }
        }
        my_query.done.yp=true;
        submit_if_done();
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        var promise=MTP.create_promise(url,parse_martindale,parse_martindale_then,function() {
            my_query.done.query=true;
            submit_if_done(); });
    }


    function parse_martindale(doc,url,resolve,reject) {
        console.log("In parse_martindale, url="+url);
        var parsedAdd,result={};
        var title=doc.querySelector(".masthead-title .same-line");
        if(title) my_query.fields.companyName=title.innerText;
        var li_brd=doc.querySelectorAll(".attorney-info-brd li"),i;
        var atty=doc.querySelector(".firm-profile-container .fp-atty-info"),name,title2;

        var temp_term_map={"addressLine1":"address1","addressLine2":"address2","stateOrRegion":"state"},x;
        if(atty && (name=atty.querySelector("a"))) my_query.fields.contactName=name.innerText;
        if(atty && (title2=atty.querySelector(".title"))) my_query.fields.contactTitle=title2.innerText;


        for(i=0;i<li_brd.length;i++) {
            parsedAdd=parseAddress.parseLocation(li_brd[i].innerText);
            console.log("parsedAdd="+JSON.stringify(parsedAdd));
            if(parsedAdd&&(parsedAdd.sec_unit_type||parsedAdd.street)&&parsedAdd.city&&parsedAdd.state&&parsedAdd.zip) {
                result.addressLine1=((parsedAdd.number?parsedAdd.number+" ":"")+
                    (parsedAdd.street?parsedAdd.street+" ":"")+(parsedAdd.type?parsedAdd.type+" ":"")+
                    (parsedAdd.suffix?parsedAdd.suffix+" ":"")).trim();

                result.addressLine2=((parsedAdd.sec_unit_type?parsedAdd.sec_unit_type+" ":"")+(parsedAdd.sec_unit_num?parsedAdd.sec_unit_num+" ":"")).trim();
                if(result.addressLine1===undefined) { result.addressLine1=result.addressLine2; result.addressLine2=""; }
                +(parsedAdd.sec_unit_num?parsedAdd.sec_unit_num+" ":"");
                result.addressLine1=result.addressLine1.trim();
                if(parsedAdd.city) result.city=parsedAdd.city;
                if(parsedAdd.state) result.stateOrRegion=parsedAdd.state;
                if(parsedAdd.zip) result.zip=parsedAdd.zip;

                break;

            }
        }
        for(x in result) my_query.fields[temp_term_map[x]!==undefined?temp_term_map[x]:x]=result[x];
        add_to_sheet();
        resolve("");
    }
    function parse_martindale_then(result) {
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
        var is_done=true,is_done_fields=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        for(x in my_query.fields) if(my_query.fields[x].length===0) is_done_fields=false;
        if(is_done && is_done_fields&&!my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done) {
            console.log("Nothing found, returning");
            GM_setValue("returnHit",true);
            return; }
    }
    function parse_schema(doc,url,resolve,reject) {
        var schema=doc.querySelectorAll("[itemtype^='http']"),itemtype,x,temp_term_map,result={postal:false};
        schema.forEach(function(elem) {
            var temp_term_map;
            console.log("elem.itemtype="+elem.getAttribute("itemtype"));
            itemtype=elem.getAttribute("itemtype");
            if(/LocalBusiness|Organization|Attorney/.test(itemtype))
            {
                var name=elem.querySelector("[itemprop='name']");
                if(name) my_query.fields.companyName=name.innerText;
            }
            if(/PostalAddress/.test(itemtype)&&!result.postal) {
                result=parse_schema_postal(elem);
                result.postal=true;
                temp_term_map={"addressLine1":"address1"};
                for(x in result) my_query.fields[temp_term_map[x]!==undefined?temp_term_map[x]:x]=result[x];
            }
        });
        add_to_sheet();
        return result;
    }
    function parse_schema_postal(elem) {
        var item,result={};
        if(item=elem.querySelector("[itemprop='streetAddress']")) result.addressLine1=item.innerText;
        if(item=elem.querySelector("[itemprop='addressLocality']")) result.city=item.innerText;
        if(item=elem.querySelector("[itemprop='addressRegion']")) {
            result.state=item.innerText;
            if(reverse_state_map[result.state]===undefined &&
               state_map[result.state]!==undefined) result.state=state_map[result.state];
        }
        if(item=elem.querySelector("[itemprop='postalCode']")) result.zip=item.innerText.trim();
        return result;
    }
    function parse_web(doc,url,resolve,reject) {
        console.log("in parse_web, url="+url);
        var result,temp_term_map={"addressLine1":"address1","stateOrRegion":"state"},x,schema_result;
        var phone_match=doc.body.innerText.match(phone_re);

        schema_result=parse_schema(doc,url,resolve,reject);
        if(!schema_result.postal) {
            result=scrape_addresses(doc,url,resolve,reject);
            for(x in result) my_query.fields[temp_term_map[x]!==undefined?temp_term_map[x]:x]=result[x];
        }
        if(phone_match && my_query.fields.phone.length===0) my_query.fields.phone=phone_match[0];
        parse_copyright(doc,url,resolve,reject);
        MTurkScript.prototype.contact_response(doc,url,{extension:"NOEXTENSION"});
        var fn=doc.querySelector(".fn");
        if(fn) my_query.fields.companyName=fn.innerText;
        resolve("");

    }
    function parse_copyright(doc,url,resolve,reject) {
        var copy_reg=/(?:©|Copyright\s*(?:©)?)(?:\s*)[\d]+(: by )?([^\.]+)/;

        var copyright=doc.querySelector("#copyright,.copyright"),match,a;
        if(copyright&&my_query.fields.companyName.length===0 && (a=copyright.querySelector("a"))) {
            my_query.fields.companyName=a.innerText; }
        else if(copyright&&(match=copyright.innerText.match(copy_reg))&&my_query.fields.companyName.length===0) {
            my_query.fields.companyName=match[1].trim();
        }
        add_to_sheet();
    }

    function scrape_addresses(doc,url,resolve,reject) {
        var result={},found_address=false,temp_match;
         var p=doc.querySelectorAll("p,div"),i,match,text,parsedAdd,len;
        for(i=0;i<p.length;i++) {
            if((match=p[i].innerText.match(/(^|\n|,).*\n+.*,?\s*[A-Za-z]{2}\s+\d{5}/))) {
                if(/^(Suite|Ste)/.test(match[0].replace(/\n+/g,",").replace(/^(\n|,)/,"")) &&
                   (temp_match=p[i].innerText.match(/[^]*\n+.*,?\s*[A-Za-z]{2}\s+\d{5}/))) match=temp_match;

                text=match[0].replace(/\n+/g,",").replace(/^(\n|,)/,"");
                //console.log("text="+text);
            }
            else if(match=p[i].innerText.match(/Address:(.*)/)) text=match[1].trim();
            else text=p[i].innerText;
            if(text.length>350||found_address) continue;


            if((match=p[i].innerText.match(phone_re))&&(len=match[0].replace(/[^\d]+/g,"").length)&&len==10) result.phone=match[0];
             //            console.log("PUNG");
            parsedAdd=parseAddress.parseLocation(text);
            if(parsedAdd&&(parsedAdd.sec_unit_type||parsedAdd.street)&&parsedAdd.city&&parsedAdd.state&&parsedAdd.zip) {
                found_address=true;

                result.addressLine1=(parsedAdd.number?parsedAdd.number+" ":"")+
                    (parsedAdd.street?parsedAdd.street+" ":"")+(parsedAdd.type?parsedAdd.type+" ":"")+
                    (parsedAdd.suffix?parsedAdd.suffix+" ":"")+(parsedAdd.sec_unit_type?parsedAdd.sec_unit_type+" ":"")
                +(parsedAdd.sec_unit_num?parsedAdd.sec_unit_num+" ":"");
                result.addressLine1=result.addressLine1.trim();
                if(parsedAdd.city) result.city=parsedAdd.city;
                if(parsedAdd.state) result.stateOrRegion=parsedAdd.state;
                if(parsedAdd.zip) result.zip=parsedAdd.zip;

                break;

            }

        }
        return result;
    }


    function parse_web_init(doc,url,resolve,reject) {
        var promise_list=[],i,links=doc.links;
        var url_list=[];
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if((/Contact|Location/i.test(links[i].innerText)||/\/attorneys\//.test(links[i].href))&&
               !url_list.includes(links[i].href)) url_list.push(links[i].href);
        }
        for(i=0;i<url_list.length;i++) {
            promise_list.push(MTP.create_promise(url_list[i],parse_web,MTP.my_then_func,MTP.my_catch_func));
        }
        promise_list.push(new Promise((this_resolve,this_reject) => { parse_web(doc,url,this_resolve,this_reject); }));
        Promise.all(promise_list).then(resolve).catch(reject);
    }

    function parse_web_then(result) {
        console.log("Done web");
        if(result && result.phone && my_query.fields.phone.length===0) my_query.fields.phone=result.phone;
        my_query.done.web=true;

        var  search_str=(my_query.fields.companyName.length>0?my_query.fields.companyName:my_query.fields.address1)+" "+my_query.fields.city+" "+my_query.fields.state;
        begin_martindale_query(search_str);
        submit_if_done();
    }

    function begin_martindale_query(search_str) {
        var domain=MTP.get_domain_only(my_query.url,true);
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str+" site:martindale.com", resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.query=true; submit_if_done(); });
    }


    function parse_web_catch(result) {
        console.log("error "+result);
        my_query.done.web=true;
        submit_if_done();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
      //  var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
       var url=document.querySelector("form a");
        my_query={url:url.innerText,
                  fields:{companyName:"",address1:"",city:"",state:"",zip:"",phone:"",email:"",contactName:"",contactTitle:"Partner"},
                  done:{"website":false,"query":false},submitted:false};
        if(!/^http/.test(my_query.url)) my_query.url="http://"+my_query.url;
        var domain=MTP.get_domain_only(my_query.url,true);
        console.log("my_query="+JSON.stringify(my_query));

        var search_str=domain+" site:facebook.com";
        const  fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, fb_query_response);
        });
        fbPromise.then(fb_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.fb=true;
            submit_if_done();
        });

        console.log("NUU");
        var webPromise=MTP.create_promise(my_query.url,parse_web_init,parse_web_then,parse_web_catch);
    }

})();