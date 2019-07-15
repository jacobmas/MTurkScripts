// ==UserScript==
// @name         Mike Bridge
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/b4ed604f683bb3140fb5ff7ef5a675c61c21ae1e/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["en.wikipedia.org","internationalstudent.com","studyoverseas.com"];
    var country_domain_map={"Australia":".edu.au","United States":".edu","Ireland":".ie","New Zealand":".ac.nz"};

    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A353EZJW2KI6TF",false);
    var MTP=MTurkScript.prototype;
    function get_acronym(name) {
        var ret="",x;
        var split=name.split(" ");
        for(x of split) {
            if(/[A-Z]/.test(x.charAt(0))) ret=ret+x.charAt(0);
        }
        return ret;
    }
    /** Flips Mount -> Mt., Saint -> St. **/
    function do_common_flip(name) {
        var term_map={"Mt.":"Mount","St.":"Saint","Univ.":"University"};
        var re=new RegExp("(^|[^A-Za-z])(Mt\.|St\.|Univ\.)($|[^A-Za-z])"),match;
        var ret=name.replace(re,function(match,p1,p2,p3) {
            return p1+term_map[p2]+p3; });
        return ret!==name?ret:null;
    }


    function wrong_page_type(b_name,b_url,p_caption,type) {
       // console.log(type+": wrong_page_type, b_name="+b_name);
        var intl_str="Intl|International|Foreign|(Global Engagement)|Global|"+
        "((^|[^A-Za-z])(ISO|ISA|ISS|ISSS|IOS|INTO|OIS|OIP)($|[^A-Za-z]))|"+
            "international community";
        var intl_pcaption_str="International Student|(Global Engagement)|international community|international education";
        var intl_re=new RegExp(intl_str,"i");
        var intl_pcaption_re=new RegExp(intl_pcaption_str,"i");
        if(/(intl$)|international/.test(type) &&
           !intl_re.test(b_name) && !intl_pcaption_re.test(p_caption)) return true;
        if(/Basketball|Football|Athletics|Ski|Rowing/i.test(b_name)) return true;
        if(/internationalurl/.test(type)&&(/\/admiss/.test(b_url)||/Admissions/.test(b_name))) {
            if(/internationalurl/.test(type) && !my_query.fields.internationalurl) my_query.fields.internationalurl=b_url;
            return true;
        }
       console.log(type+", wrong_page_type, returning false");
        return false;
    }
    function shorten_school_name(name) {

        name=name.replace(/\s(University|College)(\s[^\s]*$|$)/,"");
        return name;
    }

    function is_bad_name(b_name,b_url,p_caption,i,type)
    {
        var new_b_name;
        var reg=/[-\s\'\"’]+/g,b_replace_reg=/\s+[\-\|–]{1}.*$/g;
        var lower_b=b_name.toLowerCase().replace(reg,""),lower_my=shorten_school_name(my_query.name)
        .replace(/\s(-|@|&|and)\s.*$/).toLowerCase().replace(reg,"");
        if(wrong_page_type(b_name,b_url,p_caption,type)) return true;
        if(/internationalurl|undergradapp/.test(type)) return false;
        console.log("lower_b="+lower_b+", lower_my="+lower_my);
        if(lower_b.indexOf(lower_my)!==-1 || lower_my.indexOf(lower_b)!==-1) return false;
        b_name=b_name.replace(b_replace_reg,"");
        my_query.name=my_query.name.replace("’","\'");
        console.log("b_name="+b_name+", my_query.name="+my_query.name);
        if(MTP.matches_names(b_name,my_query.name)) return false;
        if(i===0 && b_name.toLowerCase().indexOf(shorten_school_name(my_query.name).split(" ")[0].toLowerCase())!==-1) return false
        if(b_name.indexOf(my_query.acronym)!==-1) return false;
        if((new_b_name=do_common_flip(b_name))) {
            b_name=new_b_name;
            return is_bad_name(b_name,b_url,p_caption,i);
        }
        if(p_caption.indexOf(my_query.short_name)!==-1) return false;
        return true;
    }

    function is_bad_site(b_name,b_url,type) {
        if(/\.pdf$/.test(b_url)) return true;
        if(/^youtube/.test(type) && /\/channel\//.test(b_url)&&!my_query.fields[type]) my_query.fields[type]=b_url;
        if(/^youtube/.test(type) && /\/(playlist|watch|channel\/)/.test(b_url)) return true;
        if(/internationalurl|undergradapp/.test(type) && !my_query.country_domain_re.test(MTP.get_domain_only(b_url,false))) return true;
        if(/^facebook/.test(type) && MTP.is_bad_fb(b_url)) return true;
        if(/^instagram/.test(type) && MTP.is_bad_instagram(b_url)) return true;
        if(/^twitter/.test(type) && MTP.is_bad_twitter(b_url)) return true;
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
                for(let x of ["Facebook","Instagram","YouTube","Twitter"]) {
                    if(parsed_context[x]) my_query.fields[x.toLowerCase()]=parsed_context[x];
                }
                if(parsed_context.url&&my_query.country_domain_re.test(parsed_context.url) && !my_query.domain) {
                    my_query.domain=MTP.get_domain_only(parsed_context.url,false); }
                if(/initial/.test(type) && parsed_context.url&&(resolve({type:type,url:parsed_context.url,success:true})||true)) return;
                console.log("parsed_context="+JSON.stringify(parsed_context));
            }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log(type+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(/internationalurl|undergradapp/.test(type) &&
                   !MTP.is_bad_url(b_url,bad_urls,-1) &&
                   !is_bad_name(b_name,b_url,p_caption,i,type) && !is_bad_site(b_name,b_url,type) && (b1_success=true)) break;
                else if(!/internationalurl|undergradapp/.test(type) && !is_bad_name(b_name,b_url,p_caption,i,type) &&
                        !is_bad_site(b_name,b_url,type) &&
                        (b1_success=true)) break;
            }
            if(b1_success && (resolve({success:true,url:b_url,type:type})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        if(/internationalurl/.test(type) && my_query.try_count[type]===0 && my_query.domain) {
            my_query.try_count[type]++;
            query_search("international students site:"+my_query.domain,resolve,reject,query_response,type);
            return;
        }
        if(/undergradapp/.test(type) && my_query.try_count[type]===0 && my_query.domain) {
            my_query.try_count[type]++;
            query_search("undergraduate application site:"+my_query.domain,resolve,reject,query_response,type);
            return;
        }
        if(!/internationalurl|undergradtype/.test(type) && my_query.try_count[type]===0 && my_query.domain) {
            my_query.try_count[type]++;
            query_search(my_query.name+" international site:"+type.replace(/intl$/,"")+".com",resolve,reject,query_response,type);
            return;
        }

        resolve({success:false,url:"",type:type});
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log(type+": Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }
    function parse_youtube_then(result) {
        my_query.done[result.type+'fix']=true;
        my_query.fields[result.type]=result.url;
        submit_if_done();
    }

     function parse_youtube(doc,url,resolve,reject,type) {
        var scripts=doc.scripts,i,script_regex_begin=/^\s*window\[\"ytInitialData\"\] \=\s*/,text;
        var script_regex_end=/\s*window\[\"ytInitialPlayerResponse\".*$/,ret=null,x,promise_list=[];
        var email_match,match;
        for(i=0; i < scripts.length; i++) {
            if(script_regex_begin.test(scripts[i].innerHTML)) {
                text=scripts[i].innerHTML.replace(script_regex_begin,"");
                console.log(text.indexOf(";"));
                if(text.indexOf(";")!==-1) text=text.substr(0,text.indexOf("};")+1);
                ret=parse_youtube_inner(text);
                if(!ret) {
                    resolve({type:type,url:url});
                    return;
                }
                break;
            }
        }
         if(!ret) {
                    resolve({type:type,url:url});
                    return;
                }
         console.log("YOUTUBE ret="+JSON.stringify(ret));
         if(ret.youtube_url) {
             resolve({type:type,url:ret.youtube_url});
         }
         else resolve({type:type,url:url});


    }

    function parse_youtube_inner(text) {
            var parsed,ret={},runs,match,x,content,contents,i,tabs,label,links,url;
        try { parsed=JSON.parse(text); }
        catch(error) { console.log("error parsing="+error+", text="+text); return; }
        tabs=parsed.contents.twoColumnBrowseResultsRenderer.tabs;
        try {
            for(i=0; i < tabs.length; i++) {
                if(tabs[i].tabRenderer && tabs[i].tabRenderer.title==="About" && (content=tabs[i].tabRenderer.content)) break;
            }
        }
        catch(error) { console.log(error);
                     console.log(parsed);
                     }
        if(!content) return ret;
        contents=content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer;
        //console.log("contents="+JSON.stringify(contents));
        if(contents.canonicalChannelUrl) ret.youtube_url=contents.canonicalChannelUrl;
        if((label=contents.businessEmailLabel)===undefined) ret.email="";
        if(contents.subscriberCountText && (runs=contents.subscriberCountText.runs) && runs.length>0 &&
           runs[0].text) ret.total_subscribers=runs[0].text.replace(/,/g,"");
        if(contents.country && contents.country.simpleText) ret.location=contents.country.simpleText;
        if((links=contents.primaryLinks)===undefined) links=[];
        for(i=0; i < links.length; i++) {
            url=decodeURIComponent(links[i].navigationEndpoint.urlEndpoint.url.replace(/^.*(&|\?)q\=/,"")).replace(/(&|\?).*$/,"");
            console.log("url["+i+"]="+url);
            if(/instagram\.com/.test(url)) ret.insta=url;
            else if(/facebook\.com/.test(url)) ret.fb=url.replace(/\/$/,"").replace(/facebook\.com\//,"facebook.com/pg/")+"/about";
            else if(/twitter\.com/.test(url)) ret.twitter=url;
            else if(!/plus\.google\.com|((youtube|gofundme|patreon)\.com)/.test(url) && i===0) ret.url=url;
        }
        if(contents.description && contents.description.simpleText && (ret.description=contents.description.simpleText.replace(/\\n/g,"\n"))) {
            if(match=ret.description.match(email_re)) ret.email=match[0];
            if(!ret.insta && (match=ret.description.match(/https:\/\/(www.)?instagram.com\/[A-Za-z\.0-9_\-\/]+/))) ret.insta=match[0];
            if(!ret.fb && (match=ret.description.match(/https?:\/\/([a-z]+).facebook.com\/[A-Za-z\.0-9_\-\/]+/))) ret.fb=match[0];
        }
        if(contents.businessEmailLabel===undefined) ret.businessEmailLabel=false;
        else ret.businessEmailLabel=true;
        return ret;
    }


    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("Done "+result.type+", success="+result.success);
        my_query.done[result.type]=true;

        if(result.success) {
            my_query.fields[result.type]=result.url;
        }
        if(/^youtube/.test(result.type)&&/\/channel\//.test(my_query.fields[result.type])) {
            console.log("query_promise_then, bad youtube="+my_query.fields[result.type]);
            my_query.done[result.type+"fix"]=false;
            var promise=MTP.create_promise(my_query.fields[result.type].replace(/\/$/,"")+"/about",parse_youtube,parse_youtube_then,function() {
                my_query.done[result.type+"fix"]=true; submit_if_done(); }, result.type);
        }
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
        for(x in my_query.fields) {
            if(!/internationalurl|undergradapp/.test(x)) my_query.fields[x]=my_query.fields[x].replace(/\/\?.*$/,"");
            if(x==='undergradapp' && (field=document.getElementsByName('internationalurl')[1])) field.value=my_query.fields[x];
            else if((field=document.getElementsByName(x)[0])) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }
    function get_search_term(type) {
        var ret=my_query.name+" ";

        if(/(intl$)/.test(type)) ret+="international students ";
        if(/internationalurl/.test(type)) ret="international students  site:"+my_query.domain;
        if(/undergradapp/.test(type)) ret+=(my_query.country==="United States"?" undergraduate applications ":" applications ");//site:"+my_query.domain;
        if(/^facebook/.test(type)) ret+="site:facebook.com";
        if(/^instagram/.test(type)) ret+="site:instagram.com";
        if(/^twitter/.test(type)) ret+="site:twitter.com";
        if(/^linkedin/.test(type)) ret+="site:linkedin.com/school";
        if(/^youtube/.test(type)) ret+="site:youtube.com";
        return ret;
    }
    function parse_intl_page(doc,url,resolve,reject) {
        console.log("parse_intl_page,url="+url);
        var links=doc.links,i;
        for(i=0; i < links.length; i++)
        {
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            if(/instagram\.com/.test(links[i].href) && !MTP.is_bad_instagram(links[i].href) && !my_query.fields.instagramintl&&
               links[i].href.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()!==
               my_query.fields.instagram.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()) my_query.fields.instagramintl=links[i].href;
            if(/twitter\.com/.test(links[i].href) && !my_query.fields.twitterintl && !MTP.is_bad_twitter(links[i].href) &&
               links[i].href.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()!==
               my_query.fields.twitter.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()) my_query.fields.twitterintl=links[i].href;
            if(/facebook\.com/.test(links[i].href) && !my_query.fields.facebookintl && !MTP.is_bad_fb(links[i].href) &&
               links[i].href.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()!==
               my_query.fields.facebook.replace(/https?:\/\/[^\/]*\//,"").replace(/\/$/,"").toLowerCase()) my_query.fields.facebookintl=links[i].href;

        }
        resolve("");
    }
    function parse_intl_then(result) {
        my_query.done.intlpage=true;
        submit_if_done();
    }

    function make_query_promise(type,then_func) {
        if(then_func===undefined) then_func=query_promise_then;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(get_search_term(type), resolve, reject, query_response,type);
        });
        queryPromise.then(then_func)
            .catch(function(val) {
            console.log("Failed at this "+type+" Promise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
        return queryPromise;
    }

    function init_Query()
    {
        console.log("in init_query");
        var i,x;
        bad_urls=bad_urls.concat(default_bad_urls);
        var h3=document.querySelector("#Other h3");
        var h4=document.querySelector("#Other h4");
        var name=h3.innerText.replace(/Find Social Media Links for /,"");
        var place=h4.innerText;
        var promise_list=[];
        var country_list=["United States","Australia","Ireland","United Kingdom","New Zealand"];
        var country_str="",country;
        for(x of country_list) country_str+=(country_str.length>0?"|":"")+x;
        country_str+="$";
        var country_re=new RegExp(country_str);
        country=place.match(country_re);
        console.log("country_re="+country_re);
        if(country) place=place.replace(country_re,"").trim();
        my_query={name:name,place:place,country:country?country[0]:"",
                  fields:{},done:{intlpage:false},submitted:false,try_count:{}};
        my_query.name=my_query.name.replace(/ Online$/i,"");
        my_query.short_name=shorten_school_name(my_query.name);
        my_query.acronym=get_acronym(my_query.name);
        my_query.country_domain_re=new RegExp((country_domain_map[my_query.country]||"").replace(/\./g,"\\."));
        console.log("my_query.country_domain_re="+my_query.country_domain_re);

	console.log("my_query="+JSON.stringify(my_query));
        var promise=make_query_promise("initial",initial_promise_then);

    }
    function initial_promise_then(result) {
        my_query.domain=MTP.get_domain_only(result.url,false);
        console.log("my_query.domain="+my_query.domain);
        var x,promise_list=[];
        var field_list=["internationalurl","undergradapp",
                        "facebook","facebookintl","instagram","instagramintl","linkedin",
                        "twitter","twitterintl","youtube",
                        "youtubeintl"];
        for(x of field_list) {
            my_query.fields[x]="";
            my_query.done[x]=false;
            my_query.try_count[x]=0;
            promise_list.push(make_query_promise(x));
        }
        Promise.all(promise_list).then(function() {
            console.log("Done all promises");
            var promise=MTP.create_promise(my_query.fields.internationalurl,parse_intl_page,parse_intl_then);

        }


                                      );
    }

})();