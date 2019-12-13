// ==UserScript==
// @name         Monica Perez
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Do Monica Perez person from email
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.manta.com*
// @include https://www.buzzfile.com*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/df3baff3bc4f2185e090787fe69ad2b4ae99ddbb/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/111e749ec29ddb6e09a4436f33e06eb18db4749a/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"AUPCB11YBCTT0",true);
    var MTP=MTurkScript.prototype;
    var b_name_replace_re=/^(Welcome|Home|About|Service|Frontpage|Accueil|Inicio|([A-Z0-9a-z\-]*(\.[a-z]+))|(Your\s[^\-\|]*))\s*([\-\|]+)/i;

    /* Extract the likely company name */
    function extract_company_name_bing(b_name,b_url,p_caption) {
        var ret="";
        var ellipsis_re=/\s*\.\.\.\s*$/;
        var company_suffix_re=/(^|[^A-Z0-9a-z\-])((Inc(\.?))|(Ltd(\.)?|(Co(\.)?)))($|[^A-Z0-9a-z\-])/;
        var b_name_replace_re=/^(Welcome|Home|Frontpage|Service|Accueil|Inicio|([A-Z0-9a-z\-]*(\.[a-z]+))|(Your\s[^\-\|]*))\s*([\-\|]+)/i;
        b_name=b_name.replace(b_name_replace_re,"");
        var split_re=/\s+([\-–—\-\|]+)\s+/,y,match;
        var b_split=b_name.split(split_re);
        ret=b_split[0];
        if((match=p_caption.match(/^(.{3,40}) is a/))) {
            return match[1];
        }
        for(y of b_split) {
            console.log("b_name="+b_name+",y="+y);
            y=y.replace(/\s+(in|is)\s+.*$/,"").replace(ellipsis_re,"").trim();
            if(y.replace(/[\-–—\-\|]+/g,"").trim().length===0||b_name_replace_re.test(y)) continue;
            if(/^[a-z]/.test(y.trim())) continue;
            if((match=p_caption.match(new RegExp(y.trim()))) || company_suffix_re.test(y.trim())) {
                console.log("match="+JSON.stringify(match));
                return y.trim();
            }
        }
        return ret;
    }

    function is_bad_name(b_name,p_caption,i) {
        b_name=b_name.replace(b_name_replace_re,"").replace(/\s([\-\|–]+)\s.*$/,"").trim();
        console.log("b_name="+b_name);
        if(/^[^\s]*\.[^\.\s]{1,3}$/.test(b_name)) return true;
        if(new RegExp("@"+my_query.domain).test(p_caption)) return false;
        return false;
    }
    function matches_country(country_name) {
        var opts=document.querySelector("#person_geo_country").options,x;
        for(x of opts) if(x.value===country_name) return true;
        return false;
    }

    function do_parsed_context(resolve,reject,type,parsed_context) {
        var search_str,filters;
        var city_state_re=/([^,]*),\s*(.*)$/;

        console.log("in do_parsed_context, type="+type+",parsed_context="+JSON.stringify(parsed_context));
        if(/^query/.test(type) && (/^query_person$/.test(type) || my_query.try_count[type]<3) && parsed_context.person&&!parsed_context.person.type) {
            console.log("Found person");
            my_query.fields.person_name_full_name=parsed_context.person.name.trim();
            if(parsed_context.Location) {
                let city_state_match;
                city_state_match=parsed_context.Location.match(city_state_re)
                console.log("city_state_match="+JSON.stringify(city_state_match));
                if(city_state_match &&
                   state_map[city_state_match[2].replace(/\s*Area$/,"").trim()]!==undefined) {
                    my_query.fields.person_geo_city=city_state_match[1];
                    my_query.fields.person_geo_state=state_map[city_state_match[2].replace(/\s*Area$/,"").trim()];
                    my_query.fields.country="United States of America";
                }
                else if(city_state_match&&
                        (matches_country(city_state_match[2].replace(/^(.*),([^\,]*)$/,"$2").trim()))) {
                    my_query.fields.person_geo_city=city_state_match[1];
                    if(/,/.test(city_state_match[2])) {
                        my_query.fields.person_geo_state=city_state_match[2].replace(/^([^,]*),.*$/,"$1");
                    }
                    my_query.fields.country=city_state_match[2].replace(/^(.*),([^\,]*)$/,"$2").trim();
                }

            }
            if(parsed_context.person.experience&&parsed_context.person.experience.length>0) {
                my_query.fields.company_name=parsed_context.person.experience[0].company;
                my_query.fields.person_employment_title=parsed_context.person.experience[0].title;

            }
            add_to_sheet();
            resolve("");
            return true;
        }
        else if(/^query$/.test(type) &&my_query.try_count[type]<3&& parsed_context.people&&parsed_context.people.length>0&&!/\(/.test(parsed_context.people[0].name) &&/^query$/.test(type)) {
            let url=parsed_context.people[0].url;
            search_str=decodeURIComponent(url.match(/\?q\=([^&]*)&/)[1]);
            filters=decodeURIComponent(url.match(/&filters\=([^&]*)&/)[1]);
            query_search(search_str, resolve,reject, query_response,"query_person",filters)
            return true;
        }
        else if(/^company$/.test(type) && parsed_context.Title && (!parsed_context.SubTitle||!/Architecture/.test(parsed_context.SubTitle))) {
            console.log("Doing parsed_context.Title, type="+type);
            if(parsed_context.url&&my_query.domain!==MTP.get_domain_only(parsed_context.url,true)) {
                console.log("#Switching domain to "+MTP.get_domain_only(parsed_context.url,true));
                my_query.domain=MTP.get_domain_only(parsed_context.url,true); }
            var subtitle_map={
                "Transportation":/Transportation|Airline/,"Commercial & Professional Services":/^(Contractor|Electrician)$/,
                             "Diversified Financial Services":/Private Equity/,"Real Estate":/Real Estate/};
            let y;
            for(y in subtitle_map) {
                if(parsed_context.SubTitle && subtitle_map[y].test(parsed_context.SubTitle)) {
                    my_query.fields.company_category_industry_group=y; }
            }
            if(parsed_context.Headquarters) {
                let split=parsed_context.Headquarters.split(/,\s+/);
                if(split.length>1) split[1]=split[1].trim();
                if(split.length>0) my_query.fields.person_geo_city=split[0];
                if((split.length>1) && (state_map[split[1]]!==undefined||reverse_state_map[split[1]]!==undefined)) {
                    my_query.fields.person_geo_state=split[1];
                }
                else if(matches_country(split[1])) my_query.fields.country=split[1];
            }
            var geochain=
            my_query.fields.company_name=parsed_context.Title;
            var parsed_add;
            if(parsed_context.Address && (parsed_add=new Address(parsed_context.Address,0))&&parsed_add.city&&parsed_add.state) {
                Object.assign(my_query.fields,{person_geo_city:parsed_add.city,person_geo_state:parsed_add.state});
            }
            add_to_sheet();
            if(/^company$/.test(type)) {
                resolve(parsed_context.url||"");
                return true;
            }
        }
        
       
        return false;
    }
    /* TODO: Add to AggParser */
    function parse_search_results_company(b_algo,b_name,b_url,b_caption,p_caption,type) {
        var dash_re=/\s[-\|]\s.*$/;
        var buzzfile_re=/^(.*)?\sin\s([^,]*),\s([A-Z]{2})/,match;
        if(/(linkedin|corporationwiki|facebook)\.com/.test(b_url)) {
            my_query.fields.company_name=b_name.replace(dash_re,"").trim();
            return true;
        }
        if(/buzzfile\.com/.test(b_url)&&(match=b_name.match(buzzfile_re))) {
            Object.assign(my_query.fields,{company_name:match[1].trim(),person_geo_city:match[2].trim(),
            person_geo_state:match[3].trim(),country:"United States of America"});
            return true;
        }
        return false;
    }

    function parse_search_results_query(b_algo,b_name,b_url,b_caption,p_caption,type) {
        var corpwiki_p_re=/^([^\-]*)\s*\-\s*(.*?)\s*for\s*(.*)$/;
        var relsci_re=/^(.*?)\sis\s(.*?) at ([^\.\-]*)/;
        var zoomre1=/View ([^\']*)\'s business profile as (.*?)\sat ([^\.]*)/;
        var match;
      //  console.log("b_name="+b_name+", corpwiki_p_re.test(b_name)="+corpwiki_p_re.test(b_name));
      if(/corporationwiki\.com/.test(b_url) && (match=b_name.match(corpwiki_p_re))) {
          console.log("matched corpwiki");
            my_query.fields.person_name_full_name=match[1].trim();
            my_query.fields.person_employment_title=match[2];
            if(my_query.fields.company_name==="Not Found") {
                my_query.fields.company_name=match[3];
            }
          return true;

        }
        if(/linkedin\.com\/in\//.test(b_url)) {
            let split=b_name.replace(/\s\|.*$/,"").trim().
            replace(/\.\.\.\s*$/,"").
            split(/\s+[\-–]\s+/);
            console.log("linkedin: split="+JSON.stringify(split));
            if(split.length>0) {
                let fullname=MTP.parse_name(split[0].trim());
                if(my_query.fields.person_employment_title==="Not Found"||(my_query.email.indexOf(fullname.lname.toLowerCase())!==-1 &&
                                                                          my_query.email.indexOf(my_query.fields.person_name_family_name.toLowerCase())===-1))
                {
                    console.log("Adding linkedin");
                    if(!p_caption.match(my_query.fields.company_name)&&(
                        split.length<=2 || !MTP.matches_names(my_query.fields.company_name,split[2].trim()))) return;
                    if(split.length>0) my_query.fields.person_name_full_name=split[0].trim();
                    if(split.length>1) my_query.fields.person_employment_title=split[1].trim();
                    if(split.length>2 && my_query.fields.company_name==="Not Found") {
                        my_query.fields.company_name=split[2].trim();
                    }
                    add_to_sheet();
                                return true;

                }
            }
        }
        if(/zoominfo\.com/.test(b_url)&&(match=p_caption.match(zoomre1))) {
            Object.assign(my_query.fields,{person_name_full_name:match[1],person_employment_title:match[2],
                                           company_name:match[3].trim().replace(/\.\.\.\s*$/,"")});
            add_to_sheet();
                        return true;

        }
        if(/relationshipscience\.com/.test(b_url) && (match=p_caption.match(relsci_re))&&
           (my_query.fields.person_employment_title==="Not Found")) {
            console.log("match="+JSON.stringify(match));
            Object.assign(my_query.fields,{person_name_full_name:match[1],person_employment_title:match[2],
                                           company_name:match[3].trim().replace(/\.\.\.\s*$/,"")});
            add_to_sheet();
            return true;
        }
        return false;
    }

    function parse_search_result(b_algo,b_name,b_url,b_caption,p_caption,type) {
        if(/^company/.test(type)) return parse_search_results_company(b_algo,b_name,b_url,b_caption,p_caption,type);
        if(/^query/.test(type)) return parse_search_results_query(b_algo,b_name,b_url,b_caption,p_caption,type);


        if(/^glassdoor$/.test(type)) {
            let temp_name=b_name.replace(/^Working at /,"").replace(/\s*(Reviews)?\s*\|.*$/,"");
            console.log("temp_name="+temp_name);
            if(/\/Overview\//.test(b_url) && (MTP.matches_names(my_query.fields.company_name,temp_name,false)||
               MTP.matches_names(MTP.shorten_company_name(my_query.fields.company_name),temp_name,false))) {
                my_query.glassdoor_url=b_url;
                return true;
            }
            else if(/\/Reviews\//.test(b_url) && /\-Reviews\-E/.test(b_url)) {
            //    https://glassdoor.com/Overview/Working-at-Oaktree-Capital-Management-EI_IE13762.htm
             //   /Reviews/Waste-Management-Reviews-E2094_P6.htm
                let name_match_re=/\/Reviews\/(.*)?-Reviews-([^\.]*)\.htm/,match;
                if((match=b_url.match(name_match_re))) {
                    my_query.glassdoor_url="https://glassdoor.com/Overview/Working-at-"+
                        match[1]+"-EI_I"+match[2]+".htm";
                    console.log("my_query.glassdoor_url="+my_query.glassdoor_url);
                    return true;
                }
            }

        }

        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+",type="+type+",try_count="+my_query.try_count[type]);
        var search, b_algo, i=0, inner_a;
        var search_str;
        var temp_b_url,temp_b_name,temp_p_caption;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                if(do_parsed_context(resolve,reject,type,parsed_context)) return;
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                if(/^glassdoor$/.test(type) && i>=1) break;
                if(/^company$/.test(type) && i>=3) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                b_url=b_url.replace(/\/$/,"").replace(/(https?:\/\/[^\/]*)\/en(\/.*|)$/,"$1");

                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(parse_search_result(b_algo[i],b_name,b_url,b_caption,p_caption,type)) {
                    if(/^glassdoor$/.test(type)) {
                       
                        var promise=MTP.create_promise(my_query.glassdoor_url,parse_glassdoor,resolve,reject);
                        return;
                    }
                    else {
                        resolve("");
                        return;
                    }
                }
                if(/^company$/.test(type) &&

                   !MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption,i) &&
                   my_query.domain===MTP.get_domain_only(b_url) &&
                   (b1_success=true)) break;
                else if(/^company$/.test(type) &&

                   !MTurkScript.prototype.is_bad_url(b_url, bad_urls,3,2) && !is_bad_name(b_name,p_caption,i)&&!temp_b_url) {
                    temp_b_url=b_url;
                    temp_b_name=b_name;
                    temp_p_caption=p_caption;
                }

            }
            if(my_query.try_count.company===0 && !b1_success && /^company$/.test(type) && temp_b_url&&temp_b_name) {
                b_name=temp_b_name;
                b_url=temp_b_url;
                p_caption=temp_p_caption;
                b1_success=true;
            }

            if(my_query.try_count.company===0 && b1_success && /^company$/.test(type)) {
                my_query.try_count.company++;
                let temp_company_name=extract_company_name_bing(b_name,b_url,p_caption);
                console.log("temp_company_name="+temp_company_name);
                if(my_query.fields.company_name==="Not Found") my_query.fields.company_name=temp_company_name;

            //    query_search(temp_company_name, resolve, reject, query_response,"company");
              //  return;
            }
            if(/^company$/.test(type) && my_query.try_count.company>0 && my_query.fields.company_name!=="Not Found") b1_success=true;
            /*else if(my_query.try_count.company===1 && b1_success&& /^company$/.test(type)&&my_query.fields.company_name==="Not Found") {
                my_query.fields.company_name=b_name=b_name.replace(/^(Welcome|Home)\s*([\-\|]+)/,"").replace(/\s([\-\|–]+)\s.*$/,"");
            }*/
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        query_response_next(doc,response.finalUrl,resolve,reject,type);
        
        return;
    }
    function query_response_next(doc,url,resolve,reject,type) {
        var search_str;
        if(/^query/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            let e_split=my_query.email.split("@");
            if(e_split.length>=2) {
                search_str=e_split[0].replace(/\./g," ")+" "+(my_query.fields.company_name!=="Not Found"?my_query.fields.company_name:e_split[1]);
                query_search(search_str, resolve, reject, query_response,"query");
                return;
            }
        }
        if(/^query/.test(type) && my_query.try_count[type]===1&&(my_query.fields.person_employment_title==="Not Found")) {
            my_query.try_count[type]++;
            let e_split=my_query.email.split("@");
            if(e_split.length>=2) {
                if(/[_\.]+/.test(e_split[0])) {
                    search_str=e_split[0].replace(/[_\.]+/g," ")+" "+my_query.fields.company_name; }
                else search_str=e_split[0].substr(1)+" "+my_query.fields.company_name;
                query_search(search_str, resolve, reject, query_response,"query");
                return;
            }
        }
        if(/^query/.test(type) && my_query.try_count[type]===2&&(my_query.fields.person_employment_title==="Not Found")) {
            my_query.try_count[type]++;
            let e_split=my_query.email.split("@");
            if(e_split.length>=2) {
                search_str=e_split[0]+" "+(my_query.fields.company_name!=="Not Found"?my_query.fields.company_name:e_split[1]);
                query_search(search_str+" site:linkedin.com", resolve, reject, query_response,"query");
                return;
            }
        }

        if(/^glassdoor/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            query_search(my_query.fields.company_name+" site:glassdoor.com", resolve, reject, query_response,"glassdoor");
            return;
        }
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function query_promise_then(result) {
        console.log("query_promise_then,result="+result);
        my_query.done.query=true;
         var dept_regex_lst=[];

        var title_regex_lst=[/CEO|Chief Executive|Officer|President|Manager|Owner|Partner|Founder/i];
        //var promise=MTP.create_promise(
        my_query.site_url="http://www."+my_query.domain;
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        /*var gov_promise=MTP.create_promise(my_query.site_url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);

            my_query.done.gov=true;
            submit_if_done(); },query); */
        submit_if_done();
    }

    function gov_promise_then(result) {
    }

    function company_promise_then(result) {
        console.log("company_promise_then,result="+result);
        if(result.length===0) result="http://www."+my_query.domain;
        my_query.company_url=result;



        var add_promise=MTP.create_promise(my_query.company_url,Address.scrape_address,add_promise_then,function() {
            console.log("Failed address");
            my_query.done.address=true;
            submit_if_done(); },{depth:2,debug:true});

        my_query.done.company=true;
        var search_str=my_query.email;
        if(my_query.fields.company_name!=="Not Found") search_str=search_str+" "+my_query.fields.company_name;

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val);
            my_query.done.query=true;
            submit_if_done();
        });
        const gdPromise = new Promise((resolve, reject) => {
            console.log("Beginning Glassdoor search");
            let search_str=my_query.domain+" site:glassdoor.com";
            if(result==="redo") search_str=my_query.fields.company_name+" site:glassdoor.com";
            query_search(search_str, resolve, reject, query_response,"glassdoor");
        });
        gdPromise.then(gd_promise_then)
            .catch(function(val) {
            console.log("Failed at this glassDoor Promise " + val);
            my_query.done.glassdoor=true;
            begin_buzzfile();
            submit_if_done();
        });
        submit_if_done();
    }

    function parse_glassdoor(doc,url,resolve,reject) {
        var ret={};
        console.log("IN parse_glassdoor,url="+url);
        var ie=doc.querySelectorAll(".infoEntity");
        ie.forEach(function(elem) {
            var label=elem.querySelector("label"),value=elem.querySelector(".value");
            ret[label.innerText.trim()]=value.innerText.trim();
        });
        resolve(ret);
    }

    function add_promise_then(result) {
       
        my_query.done.address=true;
        for(var x of Address.addressList) {
            x.country=x.country.replace(/^United States$/,"United States of America");
        }
         console.log("Done address: addressList="+JSON.stringify(Address.addressList));
        if(Address.addressList.length>0) {
            Address.addressList[0].country=Address.addressList[0].country.replace(/^United States$/,"United States of America");
            my_query.fields.person_geo_city=Address.addressList[0].city||"";
            my_query.fields.person_geo_state=Address.addressList[0].state||"";
            if(matches_country(Address.addressList[0].country)) {
                my_query.fields.country=Address.addressList[0].country; }
        }
        submit_if_done();
    }

    function gd_promise_then(result) {
        var country_re=/^([^\(]*)\s\(([^\)]*)\)/,match,split;
        console.log("Done glassdoor,result="+JSON.stringify(result));
        var size_value_map={"11-50":/^1 to 50/,"51-250":/^51 to 200/i,"251-1K":/(^201 to 500)|(^501)/i,"1K-5K":/^1001 to 5000/i,"5K-10K":/^5001 to 10000/i,
                            "10K-50K":/^10000+/};
        var commprof_str="(Accounting|Architectural & Engineering Services|Staffing & Outsourcing|Hotels, Motels, & Resorts|"+
            "Legal|Consulting|Building & Personnel Services|Security Services)";

        var industry_value_map={
            "Automobiles & Components":/^[^A-Za-z0-9]{2,}$/,
            "Banks":/Banks/,
            "Capital Goods":/^[^A-Za-z0-9]{2,}$/,
            "Commercial & Professional Services":new RegExp(commprof_str),
            "Construction Materials":/Construction/,
            "Consumer Durables & Apparel":/^(Home Centers \& Hardware Stores)|(Consumer Products Manufacturing)|(Beauty & Personal Accessories Stores)/,
            "Diversified Financial Services":/Investment Banking \& Asset Management|Financial Transaction Processing|(^Lending$)/,
            "Energy Equipment & Services":/Oil & Gas Services|Oil & Gas Exploration & Production|(^Energy$)/,
            "Food & Staples Retailing":/Restaurant/,
            "Food, Beverage & Tobacco":/Food & Beverage Manufacturing/,
            "Health Care Equipment & Services":/Health Care Services & Hospitals|Health Care Products Manufacturing|(^Health)/,
            "Household & Personal Products":/^[^A-Za-z0-9]{2,}$/,
            "Industrials":/^Miscellaneous Manufacturing/,
            "Insurance":/Insurance/,
            "Media":/Advertising & Marketing|Motion Picture Production & Distribution|News Outlet|TV Broadcast & Cable Networks/,
            "Pharmaceuticals, Biotechnology & Life Sciences":/Biotech & Pharmaceuticals/,
            "Real Estate":/Real Estate/,
            "Retailing":/(Department, Clothing, & Shoe Stores)|(^Wholesale$)/,
            "Semiconductors & Semiconductor Equipment":/^[^A-Za-z0-9]{2,}$/,
            "Software & Services":/Software|Internet|(^IT Services)/,
"Technology Hardware & Equipment":/^[^A-Za-z0-9]{2,}$/,
            "Telecommunication Services":/^[^A-Za-z0-9]{2,}$/,
        "Transportation":/Logistics & Supply Chain/,
        "Utilities":/^[^A-Za-z0-9]{2,}$/};
        var x;
      /*  if(!result.Website||my_query.domain!==MTP.get_domain_only(result.Website,true)) {
            console.log("Wrong glassdoor, trying buzzfile,my_query.company_url="+my_query.company_url);
            begin_buzzfile();
            return;
        }*/
        for(x in size_value_map) {
            if(size_value_map[x].test(result.Size)) my_query.fields["company size"]=x; }
        for(x in industry_value_map) {
            if(industry_value_map[x].test(result.Industry)) my_query.fields.company_category_industry_group=x; }
        if(my_query.fields.company_category_industry_group==="Not Found" &&
           /Services/.test(result.Industry)) my_query.fields.company_category_industry_group="Commercial & Professional Services";
        if((my_query.fields.person_geo_city==="Not Found" ||(my_query.fields.country==="United States of America"&&
                                                           my_query.fields.person_geo_state==="Not Found"))&& result.Headquarters!=="Unknown") {
            if((match=result.Headquarters.match(country_re))) {
                my_query.fields.person_geo_city=match[1].trim();
                if((split=my_query.fields.person_geo_city.split(/,\s+/)) && split.length>1) {
                    my_query.fields.person_geo_city=split[0];
                    my_query.fields.person_geo_state=split[1]; }
                if(matches_country(match[2].trim())) my_query.fields.country=match[2].trim(); }
            else {
                split=result.Headquarters.split(/,\s+/);
                my_query.fields.person_geo_city=split[0].trim();
                if((split.length>1) && (state_map[split[1]]!==undefined||reverse_state_map[split[1]]!==undefined)) {
                    my_query.fields.person_geo_state=split[1];
                    my_query.fields.country="United States of America";
                }
            }
        }
        my_query.done.glassdoor=true;
            submit_if_done();
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
        if(my_query.fields.person_name_full_name&&my_query.fields.person_name_full_name!=="Not Found"&&
           my_query.fields.person_name_full_name.length>0) {
            let fullname=MTP.parse_name(my_query.fields.person_name_full_name);
            my_query.fields.person_name_given_name=fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
            my_query.fields.person_name_family_name=fullname.lname?fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing):"Not Found";
            var person_data=nlp(my_query.fields.person_name_given_name).people().json().terms;
            console.log("person_data="+JSON.stringify(person_data));
            if(person_data&&person_data.length>0) {
                for(x of person_data[0].tags) {
                    if(/FemaleName/.test(x)) my_query.fields.gender="Female";
                    if(/MaleName/.test(x)) my_query.fields.gender="Male";
                }
                if(my_query.fields.gender==="Unknown") {
                    console.log("person_data[0].tags="+JSON.stringify(person_data[0].tags));
                }
            }
        }
        var seniority_map={"C-level":/Owner|owner|CEO|Chief Executive|Chief|Chairman|President|CFO|CTO|COO|Managing Partner|Partner|Principal/i,
                           "Founder":/founder|(^Founding)/i,
                           "Manager":/Manager/,"Director":/Director/,"VP":/Vice President|VP|vice-president/i};
        let found_seniority=false;
        for(x in seniority_map) {
            if(seniority_map[x].test(my_query.fields.person_employment_title)) {
                    my_query.fields.person_employment_seniority=x;
                found_seniority=true;
            }
        }
        if(my_query.fields.person_employment_title!=="Not Found" && !found_seniority) {
            my_query.fields.person_employment_seniority="Employee"; }

        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }
    function check_missing_queries() {
        var missing_list=[];
        var x;
        for(x in my_query.fields) {
            if(x==='gender' && my_query.fields[x]==='Unknown') missing_list.push(x);
            else if(x==='person_geo_state'&&my_query.fields[x]==='Not Found' && /^United States/.test(my_query.fields.country)) missing_list.push(x);
            else if(x!=='gender' && x!=='person_geo_state' && my_query.fields[x]==='Not Found') missing_list.push(x);
        }
        var str="";
        for(x of missing_list) str=str+(str.length>0?",":"")+x;
        if(str.length>0) str="Missing fields: "+str;
        else str="NO MISSING FIELDS!";
        console.log(str);
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        console.log("submit_if_done,my_query.done="+JSON.stringify(my_query.done));
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done) check_missing_queries();
       // console.log("Done!!, my_query.fields="+JSON.stringify(my_query.fields));
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function proper_casing(match,p1,p2) { return p1+p2.toLowerCase(); }
    function name_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        console.log("Moo in name_paste");
        var text = ""+e.clipboardData.getData("text/plain");
        console.log("text="+text);


        /* Save current fields */
        var cinp=document.querySelectorAll("crowd-input,select"),y;
        for(y of cinp) {
            if(y.name!==e.target.name) {
                my_query.fields[y.name]=y.value;
            }
        }
        if(text==="Not Found") {
            my_query.fields.person_name_full_name=my_query.fields.person_name_given_name=my_query.fields.person_name_family_name="Not Found";
        }
        else {
            var ret=Gov.parse_data_func(text);
            console.log("ret="+JSON.stringify(ret));
            if(ret.name===undefined) {
                my_query.fields.person_name_full_name=text.trim();
                return;
            }
            else {
                my_query.fields.person_name_full_name=ret.name.trim(); }
            if(ret.title===undefined) ret.title="";
            var fullname=MTurkScript.prototype.parse_name(ret.name);
            my_query.fields.email=ret.email?ret.email:"";
            my_query.fields.person_name_given_name=fullname.fname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing);
            my_query.fields.person_name_family_name=fullname.lname?fullname.lname.replace(/^([A-Z]{1})([A-Z]+)$/,proper_casing):"";
            var person_data=nlp(ret.name).people().json().terms,x;
            if(person_data.length>0) {

                for(x of person_data[0].tags) {
                    if(/FemaleName/.test(x)) my_query.fields.gender="Female";
                    if(/MaleName/.test(x)) my_query.fields.gender="Male";
                }
            }
            if(ret.title) my_query.fields.person_employment_title=ret.title;
            my_query.paste_count++;
        }


        add_to_sheet();
        submit_if_done();



    }
    function select_change(e) {
        my_query.fields[e.target.name]=e.target.value;
        add_to_sheet();
    }
    function nonname_paste(e) {
        e.preventDefault();
        var cinp=document.querySelectorAll("crowd-input,select"),y;
        for(y of cinp) {
            if(y.name!==e.target.name) {
                my_query.fields[y.name]=y.value;
            }
        }
        var text = ""+e.clipboardData.getData("text/plain");
        if(e.target.name==='person_geo_city') {

            var split=text.split(/,\s*/);
            my_query.fields[e.target.name]=split[0];
            if(split.length>1 &&
               (state_map[split[1].trim()]!==undefined ||
                reverse_state_map[split[1].trim()]!==undefined)) {
                my_query.fields.person_geo_state=split[1].trim();
                my_query.fields.country="United States of America";
            }
            else if(split.length>1 && (province_map[split[1].trim()]!==undefined||reverse_province_map[split[1].trim()]!==undefined)) {
                my_query.fields.person_geo_state=split[1].trim();
                my_query.fields.country="Canada";
            }
            else if(split.length>1 && matches_country(split[1].trim())) {
                my_query.fields.country=split[1].trim();
                my_query.fields.person_geo_state="Not Found"; }

        }
        else {
            my_query.fields[e.target.name]=text;
        }
        if(e.target.name==='company_name') {
            my_query.done.query=false;
            reset_form();
            my_query.try_count.query=0;
            my_query.try_count.glassdoor=1;
            my_query.fields.company_name=text.trim();
         /*   const companyPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");

                query_search(my_query.fields[e.target.name], resolve, reject, query_response,"company");
        });*/
            company_promise_then("redo");
        }
        add_to_sheet();
    }
    function noname_change(e) {
        console.log("noname_change, e="+e+", ="+JSON.stringify(e));
        my_query.fields[e.target.name]=e.target.value;
        add_to_sheet();
    }

    function reset_form() {
        var x;
        console.log("In reset_form");
        var cinp=document.querySelectorAll("crowd-input,select");

        for(x of cinp) {
            //console.log("x.name="+x.name);
            if(!/^(gender)$/.test(x.name)) my_query.fields[x.name]="Not Found";
            else if(/^gender$/.test(x.name)) my_query.fields[x.name]="Unknown";
        }
        add_to_sheet();
    }


    function begin_buzzfile() {
        if(!/United States of America|Not Found/.test(my_query.fields.country)) return;
        var innerbuzz_promise=new Promise((resolve,reject) => {
            AggParser.do_buzzfile_search(my_query.fields.company_name,{city:my_query.person_geo_city!=="Not Found"?my_query.person_geo_city:""
                                                                       ,state:my_query.person_geo_state!=="Not Found"?my_query.person_geo_state:""},resolve,reject);
        });
        innerbuzz_promise.then(inner_buzz_promise_then)
        .catch(function(response) {
            console.log("Failed inner_buzz, response="+response);
            my_query.done.buzzfile=true;
            submit_if_done();
        });
    }
    /* The result of the buzzfile query, with result.buzzfile_url containing the buzzfile url */
    function inner_buzz_promise_then(result) {
        console.log("Done inner_buzz_promise, result="+JSON.stringify(result));
        my_query.buzzfile_url=result.buzzfile_url;
        var promise=MTP.create_promise(my_query.buzzfile_url,AggParser.parse_buzzfile,parse_buzzfile_then);
    }
    function parse_buzzfile_then(result) {
        //console.log("in parse_buzzfile_then,result="+JSON.stringify(result));
        if(result.address&&result.address.city&&my_query.fields.person_geo_city==="Not Found") {
            my_query.fields.person_geo_city=result.address.city;
            my_query.fields.person_geo_state=result.address.state;
            my_query.fields.country="United States of America";
        }
        if(my_query.fields["company size"]==="Not Found") {
            let size=parseInt(result["Employees Here"]);
            console.log("size="+size);
            if(size<=10) my_query.fields["company size"]="1-10";
            else if(size<=50) my_query.fields["company size"]="11-50";
        }


      //  console.log("my_query.fields="+JSON.stringify(my_query.fields));
 submit_if_done();

        my_query.done.buzzfile=true;
    }
    function init_Query() {
        console.log("in init_query");
        var i;
        bad_urls=bad_urls.concat(default_bad_urls);
        var my_div=document.createElement("div");
        Object.assign(my_div,{style:'margin:10px;padding:5px'});
        var my_inp=document.createElement("input");
        Object.assign(my_inp,{type:'button',value:'Reset all'});
        my_div.appendChild(my_inp);
        var crowdb=document.querySelector("crowd-button");
        crowdb.parentNode.insertBefore(my_div,crowdb);
        my_inp.addEventListener("click",reset_form);

       // var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={email:document.querySelector("form a").innerText.trim(),
                  fields:{"country":"United States of America"},try_count:{"query":0,"company":0,"glassdoor":0},
                  done:{query:false,company:false,glassdoor:false,address:false},
                  submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        
        my_query.domain=MTP.get_domain_only(my_query.email.replace(/^[^@]*@/,""),true);
        my_query.original_url="http://www."+my_query.domain;
        document.querySelector("[name='person_name_full_name']").addEventListener("paste",name_paste);
        var cinp=document.querySelectorAll("crowd-input,select");
        var x;
        for(x of cinp) {
            //console.log("x.name="+x.name);
            if(!/^(country|gender)$/.test(x.name)) my_query.fields[x.name]="Not Found";
            else if(/^gender$/.test(x.name)) my_query.fields[x.name]="Unknown";
            if(x.name!=='person_name_full_name'&&x.tagName==="CROWD-INPUT") {
                x.addEventListener("paste",nonname_paste);
            }

            else if(x.tagName==="select") x.addEventListener("change",select_change);
        }
        add_to_sheet();
       var promise=MTP.create_promise(my_query.original_url,parse_original_url,MTP.my_then_func,
                                       function(response) {
            console.log("Failed at original_url "+response);
           // begin_searching_company();
        });
        Address.debug=true;
        var myPlugin = function(Doc, world) {
            world.addWords({
                'avi':'MaleName',
                '^[A-Z][a-z]{0,6}ius':'MaleName'
            })
        };
        nlp.extend(myPlugin);
        begin_searching_company();
    }

    function parse_original_url(doc,url,resolve,reject) {
        console.log("In parse_original_url,url="+url);
        if(MTP.is_bad_page(doc,url)) reject("Failed, page is bad");
        var copyright=doc.querySelectorAll(".copyright,#copyright");

        var x;
        for(x of copyright) {
            console.log("copyright: x="+x.innerText.trim());
        }
        resolve("");
    }


    function begin_searching_company() {
        var x;
        var search_str=my_query.email;
        var email_domain_str="(^([\\d]{3}\\.com|163\\.com|aon\\.at|bigpond\\.(com|net)\\.au|bk\\.ru|bluewin\\.ch|btopenworld\\.com|"+
            "cableone\\.net|charter\\.net|comcast\\.net|"+
            "cox\\.net|earthlink\\.net|emirates\\.net\\.ae|free\\.fr|freenet\\.de|fuse\\.net|"+
            "gmx\\.(at|ch|de|net)|hush\\.com|ig\\.com\\.br|knology\\.net|"+
            "libero\\.it|live\\.(ca|co\\.uk|de)|live\\.cn|live\\.nl|list\\.ru|mac\\.com|mail\\.de|mindspring\\.com|mweb\\.co\\.za|"+
            "online\.no|optusnet\\.com\\.au|(.*net\\.com)|orange\\.fr|"+
            "pacbell\\.net|protonmail\\.com|qq\\.com|rocketmail\\.com|rogers\\.com|([^\\.]*\\.rr\\.com)|runbox\\.com|"+
            "sbcglobal\\.net|seznam\\.cz|shaw\\.ca|sternemails\\.com|suddenlink\\.net|"+
            "swissmail\.org|sympatico\\.ca|tbaytel\\.net|telkomsa\\.net|telus\\.net|uol\\.com\\.br|"+
            "verizon\\.net|walla\.com|wanadoo\\.fr|web\\.de|windstream\\.net|ya(ndex)?\\.ru|ymail\\.com"+
            "))$"
        var suffix_map_re={"Australia":/\.com\.au$/,"Austria":/\.at$/,"Brazil":/\.br$/,"Canada":/((^rogers\.com)|\.ca)$/,"China":
                           /(((^(qq|139\.com))|(\.cn)))$/,"Czech Republic":/\.cz$/,
                          "France":/\.fr$/,"Germany":/(^(gmx\.net))|\.de$/,"Israel":/^walla\.com$/,"Italy":/^\.it$/,
                           "Netherlands":/\.nl$/,"Norway":/((^runbox\.com)|\.no)$/,
                          "Russia":/\.ru$/,"South Africa":/((^telkomsa\.net)|\.za)$/,"Switzerland":/((^swissmail\.org)|\.ch)$/,"United Arab Erimates":/\.ae$/};
        var suffix_map={"aon.at":"Austria","gmx.at":"Austria",
                        "sympatico.ca":"Canada","rogers.com":"Canada","live.cn":"China","qq.com":"China",
                        "139.com":"China","seznam.cz":"Czech Republic",
            "orange.fr":"France","freenet.de":"Germany","gmx.de":"Germany","web.de":"Germany",
                        "walla.com":"Israel","yandex.ru":"Russia",
                        "telkomsa.net":"South Africa","swissmail.org":"Switzerland"};
        var email_domain=new RegExp(email_domain_str);
        const companyPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            let comp_srch=search_str.replace(/^[^@]*@/,"");
            if(email_domain.test(comp_srch)) {
                my_query.fields.country="Not Found";
                for(x in suffix_map_re) {
                    if(suffix_map_re[x].test(comp_srch)) my_query.fields.country=x; }
/*                if(suffix_map[comp_srch]!==undefined && matches_country(suffix_map[comp_srch])) {
                    my_query.fields.country=suffix_map[comp_srch]; }
                else */
                add_to_sheet();
                GM_setClipboard("\""+my_query.email+"\"");
                query_search("\""+my_query.email+"\"", resolve, reject, query_response,"fake");
                return;
            }
            query_search(search_str.replace(/^[^@]*@/,""), resolve, reject, query_response,"company");
        });
        companyPromise.then(company_promise_then)
            .catch(function(val) {
            console.log("Failed at this companyPromise " + val);
            my_query.done.company=true;
            submit_if_done();
        });
    }

})();
