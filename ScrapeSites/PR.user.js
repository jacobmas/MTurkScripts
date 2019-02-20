// ==UserScript==
// @name         PR
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script for Scraping Addresses
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
    var MTurk=new MTurkScript(50000,200,[],begin_script,"ADODYZ6416W68",true);
    var MTP=MTurkScript.prototype;

    function Address(text,priority) {
        console.log("# In address for "+text);
        var fl_regex=/(,\s*)?([\d]+(th|rd|nd) Fl(?:(?:oo)?r)?)\s*,/i,match;
        var floor=text.match(fl_regex);
        text=text.replace(fl_regex,",").replace(/,\s*USA$/,"").trim();
        var parsed=parseAddress.parseLocation(text);
        if(parsed&&parsed.city&&parsed.zip) {
            this.address1=(parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
                (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"");
            this.address2="";
            this.address2=(parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
                (parsed.sec_unit_num?parsed.sec_unit_num+" ":"");
            if(!this.address2 || this.address2==="undefined") this.address2="";
            if(floor) this.address2=this.address2+(this.address2.length>0?",":"")+floor[1];
            if(!this.address2 || this.address2==="undefined") this.address2="";

            this.city=parsed.city?parsed.city:"";
            this.state=parsed.state?parsed.state:"";
            this.zip=parsed.zip?parsed.zip:"";
            console.log("state_map["+my_query.location+"]="+state_map[my_query.location]+", this.state="+this.state);

            if(!(state_map[my_query.location]===parsed.state)) priority*=2;
            this.priority=priority;
        }
        else if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
            /* Canada */
            this.zip=match[0];
            text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
            console.log("text="+text);
            if(match=text.match(/(?:,|\s)\s*([A-Z]+)\s*$/)) {
                this.state=match[1];
                text=text.replace(/(,|\s)\s*([A-Z]+)\s*$/,"");
            }
            
            console.log("text="+text);
            if(match=text.match(/^(.*),\s*([^,]*)$/)) {
                this.address1=match[1];
                this.city=match[2];
            }
            console.log("state_map[my_query.location]="+state_map[my_query.location]+", this.state="+this.state);
            if(!(state_map[my_query.location]===this.state)) priority*=2;
            this.priority=priority;

        }
        else if(true) { }
        else {
            this.priority=(1 << 25);;
        }
    }
    function addr_cmp(add1,add2) {
        if(!(add1 instanceof Address && add2 instanceof Address)) return 0;
        if(add1.priority<add2.priority) return -1;
        else if(add1.priority>add2.priority) return 1;
        else return 0;
    }

    function is_bad_name(b_name,type,i)
    {
        var match;
        if(type==="buzzfile.com" || type==="bizapedia.com" || type==="infofree.com")
        {
            match=b_name.match(/^(.*)\sin\s([^,]+),\s*([^\-\|]+)/);
            b_name=MTP.shorten_company_name(match[1]);
        }

        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=my_query.name.replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);

        if(/^web/.test(type) && MTP.matches_names(b_name,my_query.name)) return false;

        if(!/^web/.test(type) && b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        return true;

    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+" type="+type+", try_count="+my_query.try_count[type.replace(/\..*$/,"")]);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb,good_url="";
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Address) {
                console.log("* Adding address in parsed_context "+parsed_context.Address);
                my_query.address_list.push(new Address(parsed_context.Address,1));
                add_text(parsed_context.Address);
            }
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/^web/.test(type) && !MTurkScript.prototype.is_bad_url(b_url, bad_urls) &&
                   !is_bad_name(b_name,type,i) && (!b1_success) && (b1_success=true)) good_url=b_url;
                if(/prdistribution/.test(type) &&
                   /prdistribution\.com|pressreleasejet\.com/.test(b_url) &&
                   (resolve({url:b_url,type:type})||true)) return;
                else if(!/^(web|prdistribution)/.test(type) && !is_bad_bizapedia(b_url) &&

                   !is_bad_name(b_name,type,i) && (b1_success=true)) break;
                b_factrow=b_algo[i].querySelector(".b_factrow");
                if(/web/.test(type) && !is_bad_name(b_name,type,i) && b_factrow) {
                    do_bfactrow(b_factrow,my_query.try_count[type.replace(/\..*$/,"")]); }

            }
            if(good_url.length>0 && b1_success) b_url=good_url;
            if(b1_success && (!/web/.test(type)||my_query.address_list.length>0) && (resolve({url:b_url,type:type})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/prdistribution/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.first+" "+my_query.last+" "+my_query.domain+" pressreleasejet.com",
                         resolve, reject, query_response,"prdistribution");
            return;
        }
        else if(/prdistribution/.test(type) && my_query.try_count[type]===1) {
            my_query.try_count[type]++;
            query_search(my_query.name+" "+my_query.first+" "+my_query.last+" "+"prdistribution.com",
                         resolve, reject, query_response,"prdistribution");
            return;
        }
        if(/web/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             var search_str=my_query.name+(/web2/.test(type)?" address":"");
            query_search(search_str,resolve,reject,query_response,type);
            return
        }
        reject(type+": Nothing found ");
        return;
    }

    function is_bad_bizapedia(b_url) {
        return /\/(addresses|people)\//.test(b_url); }

    function do_bfactrow(b_factrow,try_count) {
        var i;
        var inner_li=b_factrow.querySelectorAll("li");
        inner_li.forEach(function(inner_li) {
            var regex=/Location:\s*(.*)$/,match,text;
            if((match=inner_li.innerText.match(regex)) && !my_query.fields.city) {
                console.log("# Trying b_factrow with "+inner_li.innerText);
                text=match[1].trim().replace(/\s*([\d\-]+),\s*([A-Za-z\s]+)\s*$/,"$2 $1");
                console.log("* Adding address in b_factrow "+text);
                my_query.address_list.push(new Address(text,3+try_count));
                add_text(text);
            }

        });
    }

    function pr_promise_then(result) {
        console.log("pr_promise_then,result="+JSON.stringify(result));
        var promise=MTP.create_promise(result.url,parse_pr_promise,begin_queries,begin_queries);
        //begin_queries();

    }
    function parse_pr_promise(doc,url,resolve,reject) {
        var loc_data_p=doc.querySelector("#newsrelease p");
        var regex=/^\s*(?:([^,]+),)?\s*(.*) - ([\d]{2}\/[\d]{2}\/[\d]+)/,match;
        if(loc_data_p && (match=loc_data_p.innerText.match(regex))) {
            console.log("match="+JSON.stringify(match));
            my_query.city=match[1];
            my_query.location=match[2].replace(/[\.]+/g,"");
            if(reverse_state_map[my_query.location]) my_query.location=reverse_state_map[my_query.location];
        }
        my_query.done.prdistribution=true;
        resolve("");
    }
    /* Do the queries */
    function begin_queries() {
        console.log("begin_queries: my_query="+JSON.stringify(my_query));
        var url1promise=MTP.create_promise(my_query.url1.url,scrape_address,parse_site_then,function(val) { urlcatch(val,"url1") },
                                           {type:"url1",ext:""});
        if(my_query.url1.url===my_query.url2.url) {
            my_query.failed_urls++;
            my_query.done.url2=true;
            submit_if_done(); }
        else {
            var url2promise=MTP.create_promise(my_query.url2.url,scrape_address,parse_site_then,function(val) { urlcatch(val,"url2") },
                                               {type:"url2",ext:""});
        }
        var search_str=my_query.name+" "+my_query.location;
        const queryPromise = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, query_response,"web");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.web=true;submit_if_done(); });

        const queryPromise2 = new Promise((resolve, reject) => {
            query_search(search_str+" address", resolve, reject, query_response,"web2");
        });
        queryPromise2.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); my_query.done.web2=true;submit_if_done(); });
        do_sites();
    }

    function do_sites() {
        var sites=["buzzfile.com","bizapedia.com","infofree.com","hotfrog.com"];//,"hotfrog.com"];//,"dandb.com"];
        var i;
        var promise_list=[];
        for(i=0;i<sites.length;i++) {
            console.log("Pushing "+sites[i]);
            promise_list.push(make_promise(my_query.name+" "+my_query.location+" site:"+sites[i],sites[i]));
        }
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
        console.log("query_promise_then,result="+JSON.stringify(result));
        if(result.type==="web" || result.type==="web2") {
            my_query.done[result.type]=true;
            submit_if_done();
        }
        else {
            let short_type=result.type.replace(/\..*$/,"");
            let url_type=result.type.replace(/\..*$/,"")+"_url";
            my_query[url_type]=result.url;
            console.log("my_query[\"url_type\"]="+my_query[url_type]);
            var promise=MTP.create_promise(my_query[url_type],Parser["parse_"+short_type],parse_site_then,MTP.my_catch_func,0);
        }

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
        update_address();
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
    }

    function update_address() {
        var top,x;

        my_query.address_list=my_query.address_list.filter(x => x.priority < (1 << 25));

        my_query.address_list.sort(addr_cmp);
        if(my_query.address_list.length===0) return;
        top=my_query.address_list[0];
        for(x in top) {
            if(x in my_query.fields) my_query.fields[x]=top[x]; }

    }
    function submit_if_done() {
        var is_done=true,x,is_done_dones=true;


        add_to_sheet();
        console.log("my_query.address_list="+JSON.stringify(my_query.address_list))
        console.log("my_query.city="+my_query.city+", my_query.location="+my_query.location);
        console.log("my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        if(!my_query.fields.city || my_query.fields.city.length===0) is_done=false;

        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            if(my_query.failed_urls>=2) {
                my_query.fields.address1=my_query.fields.address2=my_query.fields.city=my_query.fields.state=my_query.fields.zip="DEAD";
                add_to_sheet();
                MTurk.check_and_submit();
                return;
            }
            console.log("Couldn't find, returning");
            GM_setValue("returnHit",true);
            return; }
    }
    function do_address_paste(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g,",").replace(/,,/g,",").replace(/,\s*$/g,"").trim();
        console.log("text="+text);
        my_query.address_list.push(new Address(text,-50));
        add_to_sheet();
       add_text(text);
    }
    /* Add the address text */
    function add_text(text) {
        var fl_regex=/(,\s*)?([\d]+(th|rd|nd) Fl(?:(?:oo)?r)?)\s*,/i,match;
        var floor=text.match(fl_regex);
        text=text.replace(fl_regex,",").replace(/,\s*USA$/,"").trim();
        var parsed=parseAddress.parseLocation(text),add1,add2,city,state,zip;
        if(parsed&&parsed.city&&parsed.state) {
            console.log("parsed="+JSON.stringify(parsed));
            add1=(parsed.number?parsed.number+" ":"")+(parsed.prefix?parsed.prefix+" ":"")+
                (parsed.street?parsed.street+" ":"")+(parsed.type?parsed.type+" ":"")+(parsed.suffix?parsed.suffix+" ":"");
            add2=(parsed.sec_unit_type?parsed.sec_unit_type+" ":"")+
                (parsed.sec_unit_num?parsed.sec_unit_num+" ":"");
            city=parsed.city?parsed.city:"";
            state=parsed.state?parsed.state:"";
            zip=parsed.zip?parsed.zip:"";
            document.getElementsByName("address1")[0].value=add1;
            document.getElementsByName("address2")[0].value=add2;
            document.getElementsByName("city")[0].value=city;
            document.getElementsByName("state")[0].value=state;
            document.getElementsByName("zip")[0].value=zip;
        }
        else if(match=text.match(/([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/)) {
            document.getElementsByName("zip")[0].value=match[0];
            text=text.replace(/,?\s*([A-Z]{1}\d{1}[A-Z]{1} \d{1}[A-Z]{1}\d{1})$/,"");
            console.log("text="+text);
            if(match=text.match(/,\s*([A-Z]+)\s*$/)) {
                document.getElementsByName("state")[0].value=match[1];
            }
            text=text.replace(/,\s*([A-Z]+)\s*$/,"");
            console.log("text="+text);
            if(match=text.match(/^(.*),\s*([^,]*)$/)) {
                document.getElementsByName("address1")[0].value=match[1];
                document.getElementsByName("city")[0].value=match[2];
            }
        }
        else {
            document.getElementsByName("address1")[0].value=text;
        }
    }
    function parse_site_then(result) {
        console.log("in parse_site_then, result="+JSON.stringify(result));
        my_query.done[result.site]=true;

        submit_if_done();

    }
    var Parser={};
    Parser.parse_buzzfile=function(doc,url,resolve,reject,quality) {
        console.log("in parse_buzzfile, url="+url);
        var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
        var result={success:true,site:"buzzfile",quality:quality,fields:{}};
        if(!div) { resolve({success:false,site:"buzzfile"}); return; }
        result.fields=Parser.parse_postal_elem(div,4);
        add_to_sheet();
         console.log("parse_buzzfile, result="+JSON.stringify(result));
        resolve(result);

    }

    Parser.parse_hotfrog=function(doc,url,resolve,reject,quality) {
        console.log("in parse_hotfrog, url="+url);
        Parser.parse_postal(doc,url,resolve,reject,"hotfrog");

    }

    Parser.parse_postal_elem=function(elem,priority,site) {
        var ret={},text;
        var term_map={"streetaddress":"address1","addressLocality":"city","addressRegion":"state","postalCode":"zip"};
        var curr_item,x;
        for(x in term_map) {
            console.log("term_map["+x+"]="+term_map[x]+"[itemprop='"+x+"'] i");
            if(curr_item=elem.querySelector("[itemprop='"+x+"' i]")) {
                console.log("curr_item.innerText.trim()="+curr_item.innerText.trim());
                ret[term_map[x]]=curr_item.innerText.trim().replace(/\n/g,",").trim(); }
        }
        if(/,/.test(my_query.fields.address1)) {
            ret.address2=my_query.fields.address1.replace(/^[^,]+,/,"");
            ret.address1=my_query.fields.address1.replace(/,.*$/,"");
        }
        if(!my_query.fields.city) for(x in ret) my_query.fields[x]=ret[x];
        if(ret.address1&&ret.city&&ret.state&&ret.zip) {
            text=ret.address1+","+ret.city+", "+ret.state+" "+ret.zip;
            console.log("* Adding address in parse_postal_elem for "+site+", text");
            my_query.address_list.push(new Address(text,priority));
        }
    };
    Parser.parse_postal=function(doc,url,resolve,reject,type) {
        console.log("in parse_"+type+", url="+url);
        var div=doc.querySelector("[itemtype='https://schema.org/PostalAddress']");
        var result={success:true,site:type,fields:{}};
        if(!div) { resolve({success:false,site:type}); return; }
        result.fields=Parser.parse_postal_elem(div,4,type);
        add_to_sheet();
         console.log("parse_postal, result="+JSON.stringify(result));
        resolve(result);
    }

    Parser.parse_bizapedia=function(doc,url,resolve,reject) {
        console.log("in parse_bizapedia, url="+url);
        var biz=doc.querySelector("[itemtype='https://schema.org/LocalBusiness']");
        var result={success:true,site:"bizapedia",fields:{}};
        if((!biz) && (resolve(result)||true)) return;
        var td=biz.querySelectorAll("td"),i,nextItem,x;
        for(i=0;i<td.length;i++) {
            if(/^(Principal|Mailing)/.test(td[i].innerText)) {
                console.log("### Found principal address");
                nextItem=td[i].parentNode.querySelectorAll("td")[1];
                result.fields=Parser.parse_postal_elem(nextItem,4,"bizapedia");
                break;
            }
        }
        resolve(result);

    }
    Parser.parse_infofree=function(doc,url,resolve,reject) {
        console.log("In parse_infofree, url="+url);
        var add=doc.querySelector(".content .row div h4");
        var result={success:true,site:"infofree",fields:{}};
        if((!add) && (resolve(result)||true)) return;
        my_query.address_list.push(new Address(add.innerText.replace(/\n/g,","),4));
        resolve(result);

    }

    function chamber_promise_then(result) {
        my_query.chamber_url=result.url;
        var promise=MTP.create_promise(my_query.chamber_url,parse_chamber,parse_site_then,MTP.my_catch_func,result.quality);
    }
    function parse_chamber(doc,url,resolve,reject,quality) {
         console.log("in parse_chamber, url="+url);
        var result={success:true,site:"chamberofcommerce",quality:quality},i,span;
        var tel=doc.querySelector("[itemprop='telephone']");
        var first=doc.querySelector(".mainContactFirstName"),last=doc.querySelector(".mainContactLastName");
        var title=doc.querySelector(".mainContactTitle");
        if(first&&last&&title) {
            result.name=first.innerText+" "+last.innerText;
            result.title=title.innerText;
        }

        if(tel) result.phone=tel.innerText;
        resolve(result);
    }

    function dandb_promise_then(result) {
        my_query.dandb_url=result.url;
        var promise=MTP.create_promise(my_query.dandb_url,parse_dandb,parse_site_then,MTP.my_catch_func,result.quality);
    }
    Parser.parse_dandb=function(doc,url,resolve,reject,quality) {
        console.log("in parse_dandb, url="+url);
        var tel=doc.querySelector(".tel");
        var result={success:true,site:"dandb",quality:quality},i,span;
        if(tel) result.phone=tel.innerText.trim();
        var bus_lst=doc.querySelectorAll(".business li");
        for(i=0;i<bus_lst.length;i++) {
            if(/Contacts/.test(bus_lst[i].innerText) && (span=bus_lst[i].querySelector("span"))) {
                result.name=span.innerText.trim();
                result.title="Owner"; }
        }
        console.log("parse_dandb, result="+JSON.stringify(result));

        resolve(result);

    }
    function make_promise(search_str,type) {
        const webPromise = new Promise((resolve, reject) => {
            query_search(search_str, resolve, reject, query_response,type);
        });
        webPromise.then(query_promise_then)
           .catch(function(val) {
            console.log("Failed at this webPromise " + val);
            my_query.done[type.replace(/\..*$/,"")]=true;
            submit_if_done();
        });
    }
    function urlcatch(val,type) {
        console.log("Failed at "+type+" promise " + val);
        my_query.done[type]=true;
        my_query.failed_urls++;


        submit_if_done();
    }

    function scrape_address(doc,url,resolve,reject,extra) {
        var type=extra.type,ext=extra.ext,links=doc.links,i,promise_list=[];
        var contact_regex=/(Contact|Location|Privacy)/i,bad_contact_regex=/^\s*(javascript|mailto):/i,contact2_regex=/contact[^\/]*/i;
        if(/^(404|403|503|\s*Error)/i.test(doc.title) || /\?reqp\=1&reqr\=/.test(url)) {
            my_query.failed_urls+=2;
        }

        console.log("In scrape_address for type="+type+", url="+url);
        if(ext==='') {
            for(i=0; i < links.length; i++) {
                // console.log("i="+i+", text="+links[i].innerText);
                links[i].href=MTP.fix_remote_url(links[i].href,url).replace(/\/$/,"");
                if((contact_regex.test(links[i].innerText) || contact2_regex.test(links[i].href))
                   && !bad_contact_regex.test(links[i].href) &&
                   !MTurk.queryList.includes(links[i].href) && MTurk.queryList.length<10) {
                    MTurk.queryList.push(links[i].href);
                    console.log("*** Following link labeled "+links[i].innerText+" to "+links[i].href);
                    promise_list.push(MTP.create_promise(links[i].href,scrape_address_page,function(result) {
                        console.log("! Finished parsing ") },MTP.my_catch_func,type));
                    continue;
                }
            }
        }
        promise_list.push(new Promise((resolve1,reject1) => {
            scrape_address_page(doc,url,resolve1,reject1,type);
        }).then(MTP.my_then_func).catch(MTP.my_catch_func));

        Promise.all(promise_list).then(function(result) {
            console.log("Done all promises in scrape_address for "+type);
            my_query.done[type]=true;
            console.log("&& my_query.address_str_list="+JSON.stringify(my_query.address_str_list));
            resolve(""); })
        .catch(function(result) { console.log("Done all promises in scrape_address for "+type);
            my_query.done[type]=true;
            console.log("&& my_query.address_str_list="+JSON.stringify(my_query.address_str_list));
            resolve(""); });
    }
    function scrape_address_page(doc,url,resolve,reject,type) {
        console.log("scrape_address_page,url="+url);
        var posts=doc.querySelectorAll("[itemtype='https://schema.org/PostalAddress']");
        posts.forEach(function(elem) { Parser.parse_postal_elem(elem,1,type); });
        var divs=doc.querySelectorAll("div,p,span,td"),i;
        for(i=0;i<divs.length;i++) if(!divs[i].querySelector("div")) scrape_address_elem(doc,divs[i],type);
        console.log("Done scraping page "+url);
        resolve("");
    }
    function scrape_address_elem(doc,div,type) {

        var scripts=div.querySelectorAll("script,style"),i;
        var heads=doc.querySelectorAll("h1,h2,h3,h4,h5");
        for(i=0;i<heads.length;i++) heads[i].innerHTML="";
        var add_regex1=/Address: (.*)$/,match,add_elem=div.querySelector("address"),text;
        console.log("Begin scrape_address_elem on "+div.innerText);
        for(i=0;i<scripts.length;i++) scripts[i].innerHTML="";
       // console.log("Done removing scripts");
        if(div.innerText.length>500) return;
        try {
            if(div.tagName==="DIV" && /sqs-block-map/.test(div.className)) {
                var jsonstuff=JSON.parse(div.dataset.blockJson);
                console.log("#### FOUND blockjson="+JSON.stringify(jsonstuff));
                if(jsonstuff) {
                    my_query.address_list.push(new Address(jsonstuff.location.addressLine1+","+jsonstuff.location.addressLine2,0));
                }
                else {
                    console.log("div.innerHTML="+div.innerHTML); }
            }
        }
        catch(error) { console.log("Error parsing jsonstuff"); }
    //    console.log("Past block map");
        if(((match=div.innerText.match(add_regex1))&&(text=match[1])) || (add_elem && (text=fix_address_text(add_elem.innerText))) ||
        (text=fix_address_text_full(doc,div))
          )  {
           console.log("scrape_elem, text="+text);
            text=text.replace(/\n([\t\s\n])+/g,"\n").replace(/,\s*USA/,"").replace(/\n/g,",").replace(/,[\s,]*/g,",");
         //   console.log("scrape_elem, text="+text);
            let parsed;


           // console.log("add_regex1, div="+div.innerText);
            if(!my_query.address_list.includes(text)) {
                text=text.replace(/,[\s,]*/g,",");
                var address=new Address(text,1);
                if(address.city==="") {
                               console.log("temp_text="+temp_text);

                    let temp_text=text;
                    while(address.city==="" && temp_text.match(/^[^,]*,\s*/)) {
                         temp_text=temp_text.replace(/^[^,]*,\s*/,"");
                        address=new Address(temp_text,1); }
                }
                if(address.city==="") {
                    var split=address.split(/\s*|\s*/);
                    for(i=0;i<split.length;i++) {
                        if((address=new Address(split[i])) && address.city.length>0) break;
                    }
                }
                my_query.address_list.push(address);
                my_query.address_str_list.push(text);
            }
        }
        console.log("Done scrape_address_elem");

    }
    function fix_address_text_full(doc,div) {
        var text="";
        if(div.innerText.trim().length===0) return null;
    //    console.log("IN fix_address_text_full: "+div.innerText.trim());
        text=div.innerText.match(/(.{1,100}\n+)?(.*(Suite|Ste).*\n+)?.*,\s*[A-Za-z\s]+(,)?\s+[\d\-]+/i);
     //   console.log("Done match");
        if(text) return text[0].replace(/\n/g,",");
        return null; }
    function fix_address_text(text) {
        text=text.replace(/^\n/g,"").replace(/\n$/g,"");
        while(text.length>0 && !/^\s*(one|two|three|four|five|six|seven|eight|nine|[\d]+)([^a-zA-Z0-9]+)/.test(text)) {
        //    console.log("text="+text);
            let old_text=text;
            text=text.replace(/^[^\n]+\n/,"");
            if(old_text===text) break;
        }
        //text=text.replace(/\n/g,",").replace(/,,+/g,",");
        return text.trim();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i,x;
      //  var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:document.getElementsByName("company")[0].value,
                  domain:document.getElementsByName("website")[0].value.replace(/\/.*$/,""),
                  website:document.getElementsByName("website")[0].value.replace(/^[^a-zA-Z0-9_]+/,""),
                  first:document.getElementsByName("firstname")[0].value,
                  last:document.getElementsByName("lastname")[0].value,
                  location:"",
                  address_list:[],
                  address_str_list:[],

                  fields:{address1:"",address2:"",city:"",state:"",zip:""},failed_urls:0,
                  done:{web:false,web2:false,bizapedia:false,buzzfile:false,dandb:true,
                       prdistribution:false,hotfrog:false,url1:false,url2:false,infofree:false},
                  submitted:false,try_count:{}};
        my_query.url1={url:"http://www."+my_query.website.replace(/^s/,"").replace(/^www\.?/,"")};
        my_query.url2={url:"http://www."+my_query.website.replace(/^/,"")};

        for(x in my_query.done) my_query.try_count[x]=0;
        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        var input=document.querySelectorAll("crowd-input");
        input.forEach(function(elem) { elem.required=false; });
        document.getElementsByName("address1")[0].addEventListener("paste",do_address_paste);
        var promise_list=[];
        const prPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.name+" "+my_query.first+" "+my_query.last +" "+my_query.domain+ " prdistribution.com",
                         resolve, reject, query_response,"prdistribution");
        });
        prPromise.then(pr_promise_then)
            .catch(function(val) {
            console.log("Failed at this prPromise " + val);
            my_query.done.prdistribution=true;
            begin_queries(); });
        
    }


})();
