// ==UserScript==
// @name         Roc_HargroveExternal
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New RocHargrove for external site
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://par8o.quickbase.com/*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,500,[],begin_script,"A1SK2GV23YJWN9",true);
    var MTP=MTurkScript.prototype;
    if(/quickbase\.com/.test(window.location.href)) setTimeout(init_quickbase,1000);

    function is_bad_name(b_name) {
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
    function query_promise_then(result) {
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
        //update_address();
        for(x in my_query.fields) {
            
            console.log("my_query.fields["+x+"]="+my_query.fields[x]);
            if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        }
    }

    function add_to_quickbase() {
        var x,field;
        //update_address();
        for(x in my_query.ext_fields) {
            //if(/^undefined/.test(x)) continue;
            //console.log("my_query.ext_fields["+x+"]="+my_query.ext_fields[x]);
            if(field=document.querySelector("#"+x)) {
              //  console.log("Found field "+x);
                field.value=my_query.ext_fields[x];
            }
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
   
    function update_address(address,suffix) {
        var top,x;
        top=address;
        console.log("address="+JSON.stringify(address));
        top.zip=top.postcode;
        console.log("top="+JSON.stringify(top));
        top.address1=top.address1+(top.address2?", "+top.address2:"");
        var add_map={"address1":"_fid_27","city":"_fid_28","state":"_fid_29","postcode":"_fid_30"};

        for(x in top) {
            console.log("Adding "+x);
            if(add_map[x]!==undefined) {
                my_query.ext_fields[add_map[x]]=top[x]; }
        }


    }
    function remove_phones(text,suffix,target) {
        var split=text.split(/\n/);

        var ret="",match,matched_phone=false,i;
        var phone_prefix_map={"01":"07","02":"16"},fax_prefix_map={"01":"08","02":"17"};
        var pasted_name=target.id==='_fid_10';
        for(i=0;i<split.length;i++) {
            if(i==0 && pasted_name && !/[\d]/.test(split[i])) {
                console.log("Added office name to equal "+split[i].trim());
                my_query.ext_fields._fid_10=split[i].trim();
                continue;
            }
            match=split[i].match(phone_re);
            if(match) {
                if(!matched_phone && (matched_phone=true)) {
                    my_query.ext_fields._fid_18=match[0].replace(/[^\d]+/g,"");
                }
                else {
                    my_query.ext_fields._fid_19="1"+match[0].replace(/[^\d]+/g,"").replace(/^1/,""); }
            }
            else {
                ret=ret+(ret.length>0?"\n":"")+split[i];
            }
        }
        console.log("Returning ret="+ret);
        return ret;
    }

    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var match=e.target.name.match(/_([^_]*)$/);

        var suffix=match?match[1]:"01";
        if(text.indexOf("\n")===-1 && !my_query.ext_fields[e.target.id]) {
            my_query.ext_fields[e.target.id]=text;
        }
        else {
            text=remove_phones(text,suffix,e.target);
            text=text.replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
            console.log("e.target.id="+e.target.id);
            console.log("text="+text);
            var my_add=new Address(text,-50);
            if(my_add.priority<1000) {
                update_address(my_add,suffix); }
        }
        add_to_quickbase();
     //  add_text(text);
    }

    function fix_credentials() {
        var field_map={"FNP":"NP","NURSE":"NP"};
        if(field_map[my_query.credentials]!==undefined) {
            my_query.credentials=field_map[my_query.credentials]; }
    }

    function do_phone_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/[^\d]+/g,"").replace(/^1/,"");
        if(e.target.id==='_fid_19') text="1"+text;
        my_query.ext_fields[e.target.id]=text;
        add_to_quickbase();
    }

    function addr_cmp(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    }

    function complete_submission(e) {
        setTimeout(getValidationKey,500);

    }
    function getValidationKey() {
        my_query.validation_key=document.querySelector("#tdf_23").innerText.trim();
        if(!my_query.validation_key||my_query.validation_key.length<4) {
            console.log("Failed to get validation");
            return;
        }
        GM_setValue("validation_key",my_query.validation_key);
        var savebutton=document.querySelector("#footerSaveButton");
        savebutton.click();
        setTimeout(waitForSave,100,0);
        //setTimeout(updateValidationKey,2000);
    }
    function waitForSave(ct) {
        console.log("waitForSave,ct="+ct);
        var msgBox=document.querySelector("#confMsgBox");
        if(msgBox&&/Provider entry saved/.test(msgBox.innerText)) {
            updateValidationKey();
            return;
        }
        else if(ct>100) {
            console.log("Failed after "+ct+" tries");
        }
        else {
            ct+=1;
            setTimeout(waitForSave,100,ct);
        }


    }

    function updateValidationKey() {
        GM_setValue("validation_key",my_query.validation_key);
    }


    function init_quickbase() {
        my_query=GM_getValue("my_query","");
        console.log("In init_quickbase,my_query="+JSON.stringify(my_query));
        var msgBox=document.querySelector("#confMsgBox");
        if(msgBox&&/Provider entry saved/.test(msgBox.innerText)) {
            console.log("DONE");
            GM_setValue("close_tab","yes");
            return;
        }


        document.querySelector("#_fid_10").addEventListener("paste",do_address_paste);
        document.querySelector("#_fid_27").addEventListener("paste",do_address_paste);
        document.querySelector("#_fid_18").addEventListener("paste",do_phone_paste);
        document.querySelector("#_fid_19").addEventListener("paste",do_phone_paste);
        document.querySelector("#_fid_25").addEventListener("click",complete_submission);

        add_to_quickbase();
    }

    function init_Query() {
        console.log("in init_query rochargrove");
        var div=document.querySelector("form div"),match;
        var i,x;
        var links=document.querySelectorAll("form a");
        links[3].href=links[3].href.replace(/\+Fax$/i,"");
        let npi=div.innerText.match(/Copy this NPI:\s*([\d]*)/);
        let bad_search=decodeURIComponent(links[3].href.replace(/^[^\?]*\?q\=/,""));
        console.log("bad_search="+bad_search);

        var bad_re=/^([^\+]*)\+([^\+]*)\+([^\+]*)\+([^\+]*)\+([^\+]*)\+([^\+]*)\+([^\+]*)$/;
        match=bad_search.match(bad_re);
        console.log("match="+JSON.stringify(match));
        my_query={url:"",
                  first:MTP.proper_name_casing(match[1].trim()),last:MTP.proper_name_casing(match[2].trim()),
                  city:match[6].trim(),
                  state:match[7].trim(),
                  credentials:match[3].replace(/\s.*$/,"").replace(/\./g,"").replace(/\-.*$/,"").trim(),
                  NPI:npi[1].trim(),
                  quickbase_url:links[2].href,
                  fields:{},
                  ext_fields:{},
                  done:{},submitted:false};
        fix_credentials();

        Object.assign(my_query.ext_fields,{_fid_6:npi[1].trim(),_fid_7:my_query.credentials});
        GM_setValue("my_query",my_query);
        GM_setValue("validation_key","");
        console.log("my_query="+JSON.stringify(my_query));

        var quickbase_tab=GM_openInTab(my_query.quickbase_url);
        GM_addValueChangeListener("validation_key",function() {
            my_query.fields["Validation Key"]=arguments[2];
            console.log("my_query="+JSON.stringify(my_query));
            add_to_sheet();
           // quickbase_tab.close();

        });
        GM_addValueChangeListener("close_tab",function() {
            console.log("Ready to close tab at "+new Date().getTime());
           //quickbase_tab.close();

        });
     //  var promise=MTP.create_promise(my_query.url,parse_hpd,parse_hpd_then);
    }

})();