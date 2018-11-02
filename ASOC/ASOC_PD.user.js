// ==UserScript==
// @name         ASOC_PD
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  ASOC get FB and Twitter PD and Sheriff
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com*
// @include https://*twitter.com*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["dandb.com","buzzfile.com","hometownlocator.com","roadonmap.com","wikipedia.org","facebook.com","city-data.com","mapquest.com",
                 "yelp.com","zipcode.org"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    var word_version={"1":"One","2":"Two","3":"Three","4":"Four","5":"Five","6":"Six","7":"Seven"};
    var area_code_map={"201":"New Jersey","202":"District of Columbia","203":"Connecticut","204":"Manitoba","205":"Alabama","206":"Washington",
                        "207":"Maine","208":"Idaho","209":"California","210":"Texas", "212":"New York","213":"California","214":"Texas","215":"Pennsylvania",
                        "216":"Ohio","217":"Illinois","218":"Minnesota","219":"Indiana","224":"Illinois","225":"Louisiana","228":"Mississippi",
                        "229":"Georgia","231":"Michigan","234":"Ohio", "239":"Florida","240":"Maryland","242":"Bahamas","246":"Barbados", "248":"Michigan",
                        "250":"British Columbia","251":"Alabama","252":"North Carolina","253":"Washington","254":"Texas","256":"Alabama","260":"Indiana",
                        "262":"Wisconsin","264":"Anguilla","267":"Pennsylvania","268":"Antigua\/Barbuda","269":"Michigan","270":"Kentucky","276":"Virginia",
                        "281":"Texas","284":"British Virgin Islands","289":"Ontario","301":"Maryland","302":"Delaware","303":"Colorado","304":"West Virginia",
                        "305":"Florida","306":"Saskatchewan","307":"Wyoming","308":"Nebraska","309":"Illinois","310":"California","312":"Illinois",
                        "313":"Michigan","314":"Missouri","315":"New York","316":"Kansas","317":"Indiana","318":"Louisiana","319":"Iowa",
                        "320":"Minnesota","321":"Florida","323":"California","325":"Texas","330":"Ohio","334":"Alabama","336":"North Carolina",
                        "337":"Louisiana","339":"Massachusetts","340":"US Virgin Islands","345":"Cayman Islands","347":"New York","351":"Massachusetts",
                        "352":"Florida","360":"Washington","361":"Texas","386":"Florida","401":"Rhode Island","402":"Nebraska","403":"Alberta","404":"Georgia",
                        "405":"Oklahoma","406":"Montana","407":"Florida","408":"California","409":"Texas","410":"Maryland","412":"Pennsylvania",
                        "413":"Massachusetts","414":"Wisconsin","415":"California","416":"Ontario","417":"Missouri","418":"Quebec","419":"Ohio","423":"Tennessee",
                        "425":"Washington","430":"Texas","432":"Texas","434":"Virginia","435":"Utah","440":"Ohio","441":"Bermuda","443":"Maryland","450":"Quebec",
                        "456":"NANP area","469":"Texas","473":"Grenada","478":"Georgia","479":"Arkansas","480":"Arizona","484":"Pennsylvania","501":"Arkansas","502":"Kentucky","503":"Oregon","504":"Louisiana","505":"New Mexico","506":"New Brunswick","507":"Minnesota","508":"Massachusetts","509":"Washington","510":"California","512":"Texas","513":"Ohio","514":"Quebec","515":"Iowa","516":"New York","517":"Michigan","518":"New York","519":"Ontario","520":"Arizona","530":"California","540":"Virginia","541":"Oregon","551":"New Jersey","559":"California","561":"Florida","562":"California","563":"Iowa","567":"Ohio","570":"Pennsylvania","571":"Virginia","573":"Missouri","574":"Indiana","580":"Oklahoma","585":"New York","586":"Michigan","601":"Mississippi","602":"Arizona","603":"New Hampshire","604":"British Columbia","605":"South Dakota","606":"Kentucky","607":"New York","608":"Wisconsin","609":"New Jersey","610":"Pennsylvania","612":"Minnesota","613":"Ontario","614":"Ohio","615":"Tennessee","616":"Michigan","617":"Massachusetts","618":"Illinois","619":"California","620":"Kansas","623":"Arizona","626":"California",
                        "630":"Illinois","631":"New York","636":"Missouri","641":"Iowa","646":"New York","647":"Ontario","649":"Turks &amp; Caicos Islands","650":"California","651":"Minnesota","660":"Missouri","661":"California","662":"Mississippi","664":"Montserrat","670":"CNMI","671":"Guam","678":"Georgia","682":"Texas","701":"North Dakota","702":"Nevada","703":"Virginia","704":"North Carolina","705":"Ontario","706":"Georgia","707":"California","708":"Illinois","709":"Newfoundland",
                        "710":"US","712":"Iowa","713":"Texas","714":"California","715":"Wisconsin","716":"New York","717":"Pennsylvania","718":"New York","719":"Colorado","720":"Colorado","724":"Pennsylvania","727":"Florida","731":"Tennessee","732":"New Jersey","734":"Michigan","740":"Ohio",
                        "754":"Florida","757":"Virginia","758":"St. Lucia","760":"California","763":"Minnesota","765":"Indiana","767":"Dominica","770":"Georgia","772":"Florida","773":"Illinois","774":"Massachusetts","775":"Nevada","778":"British Columbia","780":"Alberta","781":"Massachusetts","784":"St. Vincent &amp; Grenadines","785":"Kansas","786":"Florida","787":"Puerto Rico","801":"Utah","802":"Vermont","803":"South Carolina","804":"Virginia","805":"California","806":"Texas","807":"Ontario","808":"Hawaii",
                        "809":"Dominican Republic","810":"Michigan","812":"Indiana","813":"Florida","814":"Pennsylvania","815":"Illinois","816":"Missouri","817":"Texas","818":"California","819":"Quebec","828":"North Carolina","830":"Texas","831":"California","832":"Texas","843":"South Carolina","845":"New York","847":"Illinois","848":"New Jersey","850":"Florida","856":"New Jersey","857":"Massachusetts","858":"California","859":"Kentucky","860":"Connecticut","862":"New Jersey","863":"Florida","864":"South Carolina","865":"Tennessee","867":"Yukon, NW Terr., Nunavut","868":"Trinidad &amp; Tobago","869":"St. Kitts &amp; Nevis","870":"Arkansas","876":"Jamaica","878":"Pennsylvania","880":"NANP area","881":"NANP area","882":"NANP area","901":"Tennessee","902":"Nova Scotia","903":"Texas","904":"Florida","905":"Ontario","906":"Michigan","907":"Alaska","908":"New Jersey","909":"California","910":"North Carolina","912":"Georgia","913":"Kansas","914":"New York","915":"Texas","916":"California","917":"New York","918":"Oklahoma","919":"North Carolina","920":"Wisconsin","925":"California","928":"Arizona","931":"Tennessee","936":"Texas","937":"Ohio","939":"Puerto Rico","940":"Texas","941":"Florida","947":"Michigan","949":"California","952":"Minnesota",
                        "954":"Florida","956":"Texas","970":"Colorado","971":"Oregon","972":"Texas","973":"New Jersey","978":"Massachusetts","979":"Texas","980":"North Carolina","985":"Louisiana","989":"Michigan"};

    function check_function() { return true;  }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");
	if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 1000);
        }
    }

    function try_bad_name_again(b_name,p_caption,site,pos)
    {
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
        else if(/(^|\s|,)ISD($|\s|,)/i.test(b_name))
        {
            b_name=b_name.replace(/(^|\s|,)ISD($|\s|,)/i,"$1I.S.D.$2");
            console.log("Trying b_name again with "+b_name);
            return is_bad_name(b_name,p_caption,site,pos);
        }
        return true;
    }

    function acronym(text)
    {
        var ret="",t_split=text.split(" ");
        for(var i=0; i < t_split.length; i++) ret=ret+t_split[i].charAt(0);
        return ret;
    }

    function is_bad_name(b_name,p_caption,site,pos)
    {
        b_name=b_name.replace(/^The\s*/,"");
        var orig_b_name=b_name;
        b_name=b_name.toLowerCase().trim();
        var name_minus_state=my_query.agency_name.replace(/,.*$/,"");
        var state_regexp=new RegExp("(\\s|,)"+my_query.state+"(\\s|$|\\.)");
        var county_acronym=acronym(my_query.county);
        if(!/County/.test(my_query.agency_name))
        {
            if(my_query.agency_name.indexOf("University")>0)
            {
                county_acronym=acronym(my_query.agency_name.match(/^.*University/)[0]);
            }
            else if(my_query.agency_name.indexOf("College")>0)
            {
                county_acronym=acronym(my_query.agency_name.match(/^.*College/)[0]);
            }
        }
      //  console.log("county_acronym="+county_acronym);
        if(b_name.indexOf(my_query.short_name.toLowerCase())===-1 &&
           (site==="facebook" || p_caption.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1)
          && ( orig_b_name.indexOf(county_acronym+" ")===-1)
          )

        {

                console.log("Failed to find "+my_query.short_name.toLowerCase());
                return try_bad_name_again(orig_b_name,p_caption,site,pos);

        }
        else if(!/^(City|Town|Village|County|Municipality|Township|Borough|County|Constable|Police|Sheriff|University)/i.test(b_name)
                && b_name.indexOf(my_query.short_name.toLowerCase())>0) {
            console.log("Bad beginning");
            return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }
        else if(!state_regexp.test(orig_b_name) &&
                //orig_b_name.indexOf(my_query.state+".")===-1 &&
                b_name.indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
                &&
                !state_regexp.test(p_caption) &&
         //   p_caption.indexOf(my_query.state+".")===-1 &&
                p_caption.toLowerCase().indexOf(reverse_state_map[my_query.state].toLowerCase())===-1
            && b_name.indexOf(name_minus_state.toLowerCase())===-1)
        {
            console.log("Failed to find state");
          //  return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }

        for(let x in state_map)
        {
            if(state_map[x]===my_query.state) continue;
            let bad_state_reg=new RegExp("(\\s|,)("+x+"|"+state_map[x]+")(\\s|$|\\,)","i");
            //console.log("bad_state_reg["+x+"]="+bad_state_reg);
            if(bad_state_reg.test(b_name) && state_map[x]!=="CO")
            {
                console.log("wrong state");
                return true;
            }
        }


        if(!/(^|\s)(Police|PD|Marshal(?:\'?s)?|Code|Public Safety|Public Saftey|Sheriff(?:\'?s)?|Constable(?:\'?s)?|SO)(\s|,|$)|Sheriff/i.test(b_name.replace(/\s-.*$/,""))
          && !(/Fire/i.test(b_name) && /Fire/i.test(my_query.agency_name)))
        {
            console.log("Not police");
            return true;
        }
        if(/Police Explorers/i.test(b_name)) { console.log("Explorers"); return true; }
        if(!/Police/.test(my_query.agency_type))
        {
            if(my_query.agency_type==="Constable" && my_query.agency_number.length>0)
            {
                let regexp_str="(Constable(\\'s office)?)?\\s+(?:Precinct|Pct(?:\\.)?)\\s*(?:"+my_query.agency_number;
                if(word_version[my_query.agency_number]!==undefined) regexp_str=regexp_str+"|"+word_version[my_query.agency_number];
                regexp_str=regexp_str+")\\s*(Constable(\\'s office)?)?";
                var const_regexp=new RegExp(regexp_str,"i");
               // console.log("const_regexp="+const_regexp);
                if(!const_regexp.test(orig_b_name)) {
                    console.log("wrong number precinct");
                    return true;
                }
            }
            var agency_type_regexp=new RegExp(my_query.agency_type,"i");
            if(!agency_type_regexp.test(b_name) && !agency_type_regexp.test(p_caption)) {
                console.log("No match of agency type");
                return true;
            }
        }
        if(site==="facebook")
        {
            let temp_b_name=orig_b_name.split(" - ")[0];
            var bad_regexp=new RegExp(my_query.short_name+"(-[^\\s]+)?\\s+([^-\\s]+\\s+){1,}");
            var good_regexp=new RegExp(my_query.short_name+"\\s+([^\\s]+\\s+){0,1}(City Hall|"+reverse_state_map[my_query.state]+")","i");
            if(bad_regexp.test(temp_b_name)&& !good_regexp.test(temp_b_name) &&!/Police|PD|Sheriff|Constable|Marshal|Fire/i.test(temp_b_name)) {
                console.log("Bad heading1");
                return try_bad_name_again(orig_b_name,p_caption,site,pos);
            }
        }
        var park_regexp=new RegExp(my_query.short_name+"(-[^\\s]+)?,?"+
                                   "\\s+([^\\s]+\\s+){0,2}(?:Park|Fire|Vet|Family|Medical|Doctor|School|Public Library|Homes|Fire|District|Rural)","i");
        var park_regexp2=new RegExp(my_query.short_name+"(-[^\s]+)?,?"+
                                    "\\s+([^\\s]+\\s+){0,2}(?:Track|Citizen|High|National|County|Dam|News|ISD|Lumber|Hardware|Church"+
                                  "|Historical|Learning|Unofficial|House|Inn|Theatre|Library|Fair|Lanes|Association|Mall|Diner|Dental|Store|Shop|FFA|VFD|Community"+
                                    "|Celebration|Stormwater|Recreation)","i");
        var heading_regexp1=new RegExp("(?:(Social Club))|Elementary School|Association");
        //|| park_regexp.test(orig_b_name) || park_regexp2.test(orig_b_name)
        if(/ Public Works/i.test(b_name) 
          || heading_regexp1.test(orig_b_name)
          )
        {
            console.log("Bad heading2");
            return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }
        var p_caption_regexp=new RegExp("(\\s|,|^)(bank locations|Automotive)(\\s|,|$)","i");
        var p_caption_first=p_caption.split(/[!\.\?]+/)[0];
        if(/(\s|,|^)(Chamber of Commerce|Historical Society|Food Stand|Senior Living)(\s|,)/i.test(p_caption)

          || /People talk about/.test(p_caption)
          ) {
            console.log("Bad caption");
            return try_bad_name_again(orig_b_name,p_caption,site,pos);
        }
        if(site==="twitter") return is_bad_twitter_name(orig_b_name,p_caption,site,pos);


        return false;
    }

    function is_bad_twitter_name(orig_b_name,p_caption,site,pos)
    {
        orig_b_name=orig_b_name.replace(/\|.*$/,"").replace(/\(@[^\)]+\)/,"").replace(my_query.short_name,"").trim();
        orig_b_name=orig_b_name.replace(/(^|\s|,)Official($|\s|,)/i,"").trim()
        .replace(/(^|\s|,)of($|\s|,)/i,"").replace(/(^|\s|,)(City|Town|Borough|Township|Village|Municipality|County)($|\s|,)/i,"")
        .trim();
        orig_b_name=orig_b_name.replace(/[,\.\?!]+/,"").replace(my_query.state,"").replace(reverse_state_map[my_query.state],"")
        .trim();
        orig_b_name=orig_b_name.replace(/Police|Department|PD|Dept|Sheriff(?:'s)?|SO/g,"").replace(/Dep/,"").trim();
        console.log("orig_b_name="+orig_b_name);
        if(orig_b_name.length===0) return false;
        else if(/^[A-Z]+$/.test(orig_b_name)) return false;
        else {
            console.log("Twitter name="+orig_b_name);
            return false;
        }
    }

    function is_bad_site(site,b_url)
    {
        if((site==="facebook" && (/\/(pages|public|groups|events|posts)\//.test(b_url) ||
                                /permalink\.php/.test(b_url) || /x\.facebook\.com/.test(b_url) || /reviews(\/|$)/.test(b_url)
                                || !/www\.facebook\.com/.test(b_url)
                                ) ) ||
          (site=="twitter" && (/\/status\//.test(b_url)))
          )
        {
            console.log("bad url format");
            return true;
        }
        return false;
    }

    function get_bing_url(doc)
    {
        var b_context=doc.getElementById("b_context");
        var infocard,inner_a,i,cbtn;
        if(b_context)
        {
            infocard=b_context.getElementsByClassName("infoCardIcons");
            cbtn=b_context.getElementsByClassName("cbtn");
            if(infocard.length>0)
            {
                inner_a=infocard[0].getElementsByTagName("a");
                for(i=0; i < inner_a.length; i++)
                {
                    console.log("* inner_a["+i+"].href="+inner_a[i].href);
                    if(/Official site/.test(inner_a[i].innerText)) return inner_a[i].href;
                }
            }
            else if(cbtn.length>0)
            {
                for(i=0; i < cbtn.length; i++)
                {
                    console.log("* cbtn["+i+"].href="+cbtn[i].href);
                    if(/Website/.test(cbtn[i].innerText)) return cbtn[i].href;
                }
            }

        }
        return "";
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var site;
        if(/site%3A([^\.]+).com/.test(response.finalUrl)) site=response.finalUrl.match(/site%3A([^\.]+).com/)[1];
        else site="bing";

        console.log("in query_response for "+site+"\n"+response.finalUrl);

        var search, b_algo, i=0, inner_a;

	var b_url="", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,lgb_info;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            if(site==="bing")
            {
                b_url=get_bing_url(doc);
                if(b_url.length>0)
                {
                    resolve(b_url);
                    return;
                }
            }



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 5; i++)
            {
                if(site==="bing" && i>=0) break;
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(site+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(i< 5 && !(site==="bing" && is_bad_url(b_url,bad_urls,-1)) &&
                             !is_bad_name(b_name,p_caption,site,i) && !is_bad_site(site,b_url)

                  )  {
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
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.try_count[site]===0)
        {
            my_query.try_count[site]++;
            query_search(my_query.query_name+" site:"+site+".com", resolve, reject, query_response);
            return;
        }
        else
        {
            resolve("");
            return;
        }

        //reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

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

    function test_location(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");


        console.log("in test_location "+response.finalUrl);

        var search, b_algo, i=0, inner_a;

        var b_url="", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,lgb_info,mt_tleWrp,address;
        try
        {
            mt_tleWrp=doc.getElementById("mt_tleWrp");
            if(mt_tleWrp)
            {
                address=mt_tleWrp.getElementsByTagName("a")[0].innerText.replace(/, US$/,"");
                console.log("Found address="+address);
                var parsed=parseAddress.parseLocation(address);
                console.log("Parsed address="+JSON.stringify(parsed));
                if(parsed!==null && parsed.state!==undefined && parsed.city!==undefined)
                {
                    console.log("Parsed address="+JSON.stringify(parsed));

                    my_query.temp_fb_result.success=parsed.state.trim()===my_query.state.trim() && parsed.city.trim()===my_query.city.trim();
                    my_query.temp_fb_result.extra="Did Bing";
                     GM_setValue("fb_result",my_query.temp_fb_result);
                    return;
                }
            }
        }
        catch(error) { console.log("Error "+error);
                     my_query.temp_fb_result.success=false;
                     GM_setValue("fb_result",my_query.temp_fb_result);
                      return;

                     }
        my_query.temp_fb_result.success=false;
                     GM_setValue("fb_result",my_query.temp_fb_result);
                      return;
    }

    function test_promise_then(result) { }


    function submit_if_done()
    {
        console.log("(doneFB, doneTwitter,doneWebFB,doneWebTwitter,submitted)=("+my_query.doneFB+","+my_query.doneTwitter+","+
                    my_query.doneWebFB+","+my_query.doneWebTwitter+","+my_query.submitted+")");
        if(my_query.doneFB && my_query.doneTwitter  && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function);
        }
    }

    /* Following the finding the district stuff */
    function fb_promise_then(url,caller) {
        console.log("fb:url="+url);
        if(caller===undefined) caller="";
        console.log("fb_promise_then:caller="+caller);
        url=url.replace(/\/posts\/?.*$/,"");
        url=url.replace(/^https:\/\/www\.facebook\.com\/pg\/([^\/]+)\/about/,"https://www.facebook.com/$1");
        url=url.replace(/\/(about|videos|photos|info)\/?.*$/,"");
        url=url.replace(/(m|business)\.facebook\.com/,"www.facebook.com");
         console.log("fb:url="+url);
        GM_setValue("fb_result","");
        if(url.length===0)
        {
            if(document.getElementsByName("FB URL")[0].value.length===0||caller==="website")
            {
                document.getElementsByName("FB URL")[0].value="none";
                document.getElementsByName("FB Likes")[0].value="none";
                document.getElementsByName("FB Followers")[0].value="none";
            }
            if(caller==="website") my_query.doneWebFB=true;
            else my_query.doneFB=true;
            submit_if_done();
            return;

        }
        GM_addValueChangeListener("fb_result", function() {
            var result=arguments[2];

            if(document.getElementsByName("FB URL")[0].value.length===0||caller==="website")
            {
                document.getElementsByName("FB URL")[0].value=result.fb_url;
                document.getElementsByName("FB Likes")[0].value=result.fb_likes;
                document.getElementsByName("FB Followers")[0].value=result.fb_followers;
                document.getElementsByName("Most_Recent_Activity")[0].value=result.most_recent;
            }
            console.log("fb_result="+JSON.stringify(result));
            if(caller==="website") my_query.doneWebFB=true;
            else
            {
                my_query.doneFB=true;
                if(!my_query.doneWebFB && my_query.webFB_url.length>0)
                {
                    fb_promise_then(my_query.webFB_url,"website");
                    my_query.webFB_url="";
                    submit_if_done();
                    return;
                }

            }
            submit_if_done();
        });

        GM_setValue("fb_url",{url:url,website:caller==="website"});
        console.log("fb_url="+JSON.stringify(GM_getValue("fb_url")));

    }
    function twitter_promise_then(url,caller) {
        console.log("twitter:url="+url);
        GM_setValue("twitter_result","");
        if(caller===undefined) caller="";

        if(url.length===0)
        {
            if(document.getElementsByName("Twitter URL")[0].value.length===0||caller==="website")
            {
                document.getElementsByName("Twitter URL")[0].value="none";
                document.getElementsByName("Twitter Followers")[0].value="none";
            }
            if(caller==="website") my_query.doneWebTwitter=true;
            else
            {
                my_query.doneTwitter=true;
                if(!my_query.doneWebTwitter && my_query.webTwitter_url.length>0)
                {
                    fb_promise_then(my_query.webTwitter_url,"website");
                }

            }
            submit_if_done();
            return;

        }
        GM_addValueChangeListener("twitter_result", function() {
            var result=arguments[2];
            console.log("twitter_result="+JSON.stringify(result));
            if(document.getElementsByName("Twitter URL")[0].value.length===0 ||caller==="website")
            {
                document.getElementsByName("Twitter URL")[0].value=result.twitter_url;
                document.getElementsByName("Twitter Followers")[0].value=result.twitter_followers;
            }
            if(caller==="website") my_query.doneWebTwitter=true;
            else my_query.doneTwitter=true;
            submit_if_done();
            return;
        });
        GM_setValue("twitter_url",{url:url,website:caller==="website"});
    }

    function bing_promise_then(url)
    {
        console.log("bing: official url="+url);
        my_query.agency_url=url;
        GM_setValue("my_query",my_query);
        var search_str;
        search_str=my_query.agency_name+" site:facebook.com";
        const fbPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for FB");
            query_search(search_str, resolve, reject, query_response);
        });

        fbPromise.then(fb_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this fbPromise " + val); GM_setValue("returnHit",true); });
        search_str=my_query.agency_name+" site:twitter.com";

        const twitterPromise = new Promise((resolve, reject) => {
            console.log("Beginning Twitter search");
            query_search(search_str, resolve, reject, query_response);
        });
        twitterPromise.then(twitter_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
        if(my_query.agency_url.length>0)
        {

         /*   GM_xmlhttpRequest({method: 'GET', url: my_query.agency_url,
                               onload: function(response) { parse_web(response); },
                               onerror: function(response) { console.log("Failed web"); my_query.doneWebFB=true; my_query.doneWebTwitter=true; submit_if_done(); },
                               ontimeout: function(response) { console.log("Failed web"); my_query.doneWebFB=true; my_query.doneWebTwitter=true; submit_if_done(); }
                              }); */
        }
        else
        {
            my_query.doneWebFB=true; my_query.doneWebTwitter=true; submit_if_done();
        }
    }

    function parse_web(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,links=doc.links,foundWebTwitter=false,foundWebFB=false;
        for(i=0; i < links.length; i++)
        {

            if(/facebook\.com/.test(links[i].href) && !is_bad_site("facebook",links[i].href) && !foundWebFB)
            {
                console.log("WEB: found FB "+links[i].href);
                foundWebFB=true;
                my_query.webFB_url=links[i].href;
                if(my_query.doneFB)
                {
                    fb_promise_then(links[i].href,"website");
                }
            }

            else if(/twitter\.com/.test(links[i].href) && !is_bad_site("twitter",links[i].href) && !foundWebTwitter)
            {
                console.log("WEB: found Twitter "+links[i].href);
                foundWebTwitter=true;
                my_query.webTwitter_url=links[i].href;
                if(my_query.doneTwitter)
                {
                    twitter_promise_then(links[i].href,"website");
                }
            }
        }
        if(!foundWebFB) my_query.doneWebFB=true;
        if(!foundWebTwitter) my_query.doneWebTwitter=true;
        submit_if_done();


    }

    function is_bad_fb_page()
    {
        var _jlx=document.getElementsByClassName("_jlx");
        var community=document.getElementsByClassName("_6590");
        var page_name=document.getElementsByClassName("_64-f");
         var about=document.getElementsByClassName("_u9q"),i,inner_a,j,k;
       var categories;
        var about_fields;
        var description=document.getElementsByName("description");
     /*   if(description.length>0)
        {
            console.log("description[0].content="+description[0].content);
            if(description[0].content.indexOf(", "+my_query.state)===-1) return true;
        }*/
         var url_container=document.getElementsByClassName("_v0m");
        var official_url="";
        if((_jlx.length>0 && /Unofficial Page/i.test(_jlx[0].innerText)) || community.length===0)
        {
            console.log("Unofficial or no community");
            return true;
        }
      
        if(url_container.length>0 && url_container[0].getElementsByTagName("a").length>=2) official_url=url_container[0].getElementsByTagName("a")[1].href;
        if(about.length===0) return false;

        var found_community=false;
        if(official_url.length>0 && my_query.agency_url.length>0 && official_url.indexOf(get_domain_only(my_query.agency_url,true))!==-1)
        {
            return false;
        }
        for(j=0; j < about.length; j++)
        {
            about_fields=about[j].getElementsByClassName("_4bl9");
            for(i=0; i < about_fields.length; i++)
            {
                if(phone_re.test(about_fields[i].innerText))
                {
                    let num_only=about_fields[i].innerText.replace(/[^\d]+/g,"");
                    console.log("Phone number: "+about_fields[i].innerText+", num_only="+num_only);

                    if(area_code_map[num_only.substr(0,3)]===undefined || state_map[area_code_map[num_only.substr(0,3)]]===undefined ||
                       state_map[area_code_map[num_only.substr(0,3)]]!==my_query.state)
                    {
                        console.log("Wrong state, found "+state_map[area_code_map[num_only.substr(0,3)]]);
                        return true;
                    }
                }
                inner_a=about_fields[i].getElementsByTagName("a");
                for(k=0; k < inner_a.length; k++)
                {
                    // console.log("inner_a.length="+inner_a.length);
                    if(inner_a.length>0)
                    {
                        console.log("j="+j+",i="+i+"inner_a["+k+"].href="+inner_a[k].href);
                    }

                    if(inner_a[k].href.indexOf("/search/str/")!==-1)
                    {
                        console.log("MOO");
                        var keywords=inner_a[k].innerText;
                        console.log("keywords="+keywords);
                        if(/(^Law Enforcement Agency$)|(^Police Station$)|(^Government Organization$)|(^Public & Government Service$)/.test(keywords)) return false;
                       /* if(/Government Organization|City Hall|Borough|(^City$)|Locality|Public &|Government|Town Hall|Public Service/.test(keywords)) return false;
                        if(/(^Community$)|(^Community Organization$)/.test(keywords)) { found_community=true; }
                        if(/Car Wash|Local Business|Automotive Repair Shop|Performing Arts|Musician\/Band/.test(keywords)) return true;
                        if(/Sports Club|Ice Skating Rink|Stadium, Arena \& Sports Venue|Farm|Bar \& Grill|Beer|Brewery|Pizza|Business|School/.test(keywords)) return true;
                        if(/Restaurant|(?:^Pub$)|Photographer|Nonprofit Organization|Media|Newspaper|Tour Agency|Grocery/.test(keywords)) return true;
                         if(/Event Planner|Florist|Church|Religious|Professional Service|Funeral|(^Performance)|Wedding/.test(keywords)) return true;
                         if(/Bowling Alley|Gift Shop|Antique Store|Travel & Transportation|Hotel|Apartment|Real Estate|Political Organization/.test(keywords)) return true;
                        if(/Motel|Food|(Store$)|Sports||Lounge|Bar|Medical|Chiropractor/.test(keywords)) return true;*/

                        console.log("this keyword good");

                    }
                }
            }
            console.log("MOOTOO");
        }
        console.log("SHROOTOO");
        if(found_community)
        {
            console.log("Found Community");
            if(official_url.length>0 && my_query.agency_url.length>0 && official_url.indexOf(get_domain_only(my_query.agency_url,true))!==-1)
            {
                return false;
            }
            my_query.check_about_page=true;
            return false;

            /*console.log("Returning hit");
            GM_setValue("returnHit",true);
            my_query.submitted=true;
            return true;*/
        }
        return true;

//        return false;
    }


    function check_about_page()
    {
        window.location.href=window.location.href.replace("https://www.facebook.com/","https://www.facebook.com/pg/").replace(/\/$/,"")+"/about/?ref=page_internal";
    }

    /* Do facebook parsing of homepage (should be fixed to go here directly) */


    function do_fbhome(time)
    {
        console.log("time="+time);
        console.log("GM_getValue(\"fb_url\").website="+GM_getValue("fb_url").website);
        if(time===undefined) time=0;
        var result={success:true,fb_url:"none",fb_likes:"none",fb_followers:"none",most_recent:""};
        var _jlx=document.getElementsByClassName("_jlx");
        var community=document.getElementsByClassName("_6590");
        var inner_community,i,j;
        var address=document.getElementsByClassName("_2wzd");
        var posts=document.getElementsByClassName("_427x");

        var timestamp=document.getElementsByClassName("timestampContent");
        var about=document.getElementsByClassName("_u9q");
        console.log("Doing FB home timestamp.length="+timestamp.length);
        /* Deal with unofficial */


        if(posts.length===0 && time<=10)
        {
            time++;
            window.scrollTo({
                top: 1000*time,
                behavior: "smooth"
            });
            console.log("Doing FB home posts.length="+posts+", time="+time);
            setTimeout(function() { do_fbhome(time); },1000);
            return;
        }
        console.log("posts.length="+posts);
        if(is_bad_fb_page())
        {
            console.log("bad fb page");
            result.success=false;
            GM_setValue("fb_result",result);
            return;
        }

        if(address.length>0)
        {
            console.log("address.length="+address.length);
            var parsedAdd=parseAddress.parseLocation(address[0].innerText.trim().replace(/\n/g,",").replace(/\s*\([^\)]+\)\s*/,""));
            console.log("parsedAdd="+JSON.stringify(parsedAdd));
            if(parsedAdd.state===undefined)
            {
                var state_regex=/([^\n,]+), ([^\n,]+) ([\d]{5})$/;
                var my_match=address[0].innerText.trim().match(state_regex);
                if(my_match)
                {
                    parsedAdd.state=my_match[2];
                }
            }
            if(parsedAdd.state!==my_query.state && state_map[parsedAdd.state]!==my_query.state)
            {
                console.log("Bad address parsed="+parsedAdd.state+", my_query="+my_query.state);
                result.success=false;
                GM_setValue("fb_result",result);
                return;
            }
            if(!/County/i.test(my_query.agency_name) && parsedAdd.city!==undefined && parsedAdd.city!==my_query.city)
            {
                console.log("Bad address city parsed="+parsedAdd.city+", my_query="+my_query.city);
                result.success=false;
                GM_setValue("fb_result",result);
                return;
            }
        }
        else
        {
            console.log("*** NO address");

        }


        if(posts.length>0)
        {
            var pos=0;
            if(posts[pos].getElementsByClassName("_5m7w").length>0 && pos+1<posts.length) pos++;
            timestamp=posts[pos].getElementsByClassName("timestampContent");
            console.log("posts["+pos+"].timestamp.length="+timestamp.length);
            if(timestamp.length>0)
            {
                var abbr=timestamp[0].parentNode;
                console.log("abbr="+abbr+"\tabbr.title="+abbr.title);
                result.most_recent=abbr.title.replace(/\s.*$/,"");
            }
        }


        inner_community=community[0].getElementsByClassName("_4bl9");
        for(i=0; i < inner_community.length; i++)
        {
            if(/([\d]+) (?:people like|person likes) this/.test(inner_community[i].innerText))
            {
                result.fb_likes=inner_community[i].innerText.match(/([,\d]+) (?:people like|person likes) this/)[1]
                 .replace(/,/g,"");
            }
            if(/([\d]+) (?:people follow|person follows) this/.test(inner_community[i].innerText))
            {
                result.fb_followers=inner_community[i].innerText.match(/([,\d]+) (?:people follow|person follows) this/)[1]
                .replace(/,/g,"");
            }
        }
        console.log("timestamp.length="+timestamp.length);



        result.fb_url=window.location.href;

        var a3f=document.getElementsByClassName("_a3f");
        var a3fregex=/markers\=([\d\.-]+)%2C([\d\.-]+)&/,a3fmatch;

        if(a3f.length>0 && address.length===0)
        {
            var src=a3f[0].src;
            a3fmatch=src.match(a3fregex);
            if(a3fmatch!==null)
            {

                my_query.temp_fb_result=result;
                console.log("a3fmatch="+JSON.stringify(a3fmatch));
                const testPromise=new Promise((resolve,reject) => {

                    query_search(a3fmatch[1]+", "+a3fmatch[2],resolve,reject,test_location);
                                 });
                testPromise.then(test_promise_then)
                .catch(function(val) { console.log("Failed testPromise "+val); GM_setValue("returnHit",true); return; });
                console.log("*** REturning");
                return;
            }

        }


        if(my_query.check_about_page)
        {
            GM_setValue("temp_fb_result",result);
            check_about_page();
            return;
        }
        else
        {
            GM_setValue("fb_result",result);
        }

    }
    /* Do Facebook parsing  stuff */
    function do_fb()
    {
        console.log("Doing FB");
        my_query.check_about_page=false;
        var result={email:"",name:"",url:window.location.href,phone:""};
        var i;
        var contactlinks=document.getElementsByClassName("_50f4");
        var namelinks=document.getElementsByClassName("_42ef");
        if(window.location.href.indexOf("/about/")===-1)
        {
            do_fbhome();
            return;
        }

        do_fb_about();
        return;
    }
    function do_fb_about()
    {
        var i;
        var contactlinks=document.getElementsByClassName("_50f4");
        var namelinks=document.getElementsByClassName("_42ef");
        var result=GM_getValue("temp_fb_result",{success:false});
        var about=document.getElementsByClassName("_3-8w");
       /* for(i=0; i < contactlinks.length; i++)
        {
            if(email_re.test(contactlinks[i].innerText))
            {
                result.email=contactlinks[i].innerText.match(email_re);
                console.log("Found email="+result.email);
            }
            else if(phone_re.test(contactlinks[i].innerText))
            {
                result.phone=contactlinks[i].innerText.match(phone_re);
                console.log("Found phone="+result.phone);
            }
        }
        for(i=0; i < namelinks.length; i++)
        {
            result.name=namelinks[i].innerText;
        }*/
        if(/(^|\s)official(\s)/) { }


         console.log("bad fb page");
            result.success=false;
            GM_setValue("fb_result",result);
            return;

          console.log("Done FB");
        GM_setValue("temp_fb_result","");
        GM_setValue("fb_result",result);

    }

    function is_bad_twitter(bio,location)
    {
        var url_elem=document.getElementsByClassName("ProfileHeaderCard-urlText");
        var url="";
        var profilehead=document.getElementsByClassName("ProfileHeaderCard");
        console.log("profilehead.length="+profilehead.length);
        if(profilehead.length===0) return;
        if(url_elem.length>0 && url_elem[0].getElementsByTagName("a").length>0) url=url_elem[0].getElementsByTagName("a")[0].title;
        console.log("url="+url);
        if(bio===undefined || bio===null || bio.innerText===undefined) bio={innerText:""};
        var bio_split=bio.innerText.split(/[\.\!\?]+/,);
        var bio_text=bio.innerText;
        console.log("bio_split="+bio_split);
        var badges=document.getElementsByClassName("ProfileHeaderCard-badges");
        if(badges.length===0 || badges[0].getElementsByClassName("Icon--verified").length===0)
        {
            console.log("not verified");
            if(!/(^|\s|,)(the public|official|government)($|\s|,|\.)/i.test(bio.innerText)
             &&  !/gov/.test(url) && !/Twitter account for/.test(bio.innerText)

               && !(my_query.agency_url.length>0 && url.toLowerCase().indexOf(get_domain_only(my_query.agency_url,true))!==-1)

              ) {
                console.log("no official word");
                //return true;
            }
          //  return true;
        }
        var matches_other_state,x,begin_bio;
        var loc_split=location.innerText.split(",");
        if(/England|Canada|UK/.test(loc_split[loc_split.length-1])) return true;
        if(/,/.test(location.innerText))
        {

            var first_part=location.innerText.split(",")[0].trim();

            if(first_part.toLowerCase().indexOf(my_query.city.toLowerCase())===-1 &&
               my_query.city.toLowerCase().indexOf(first_part.toLowerCase())===-1 &&
               first_part.toLowerCase().indexOf(my_query.county.toLowerCase())===-1)
            {
                if(loc_split.length===2)
                {
                    console.log("Matched bad city1 "+first_part.toLowerCase()+", my_query="+my_query.city.toLowerCase());
                    return true;
                }
                else if(loc_split.length===3)
                {
                    if(loc_split[1].trim().toLowerCase().indexOf(my_query.city.toLowerCase())===-1 &&
                      my_query.city.toLowerCase().indexOf(loc_split[1].trim().toLowerCase())===-1)
                    {
                        console.log("Matched bad city2");
                        return true;
                    }
                }

            }
        }

        var state_part=location.innerText;
        if(/,/.test(location.innerText))
        {
            state_part=location.innerText.split(",")[loc_split.length-1].replace(/\./g,"").trim();
        }
        for(x in state_map)
        {
          //  console.log("x="+x);
            if(state_map[x]===my_query.state) continue;
            let curr_regex=new RegExp("(,|\s|^)"+x);
            var reverse_regex=new RegExp(state_map[x]);
            if(curr_regex.test(state_part))
            {
                console.log("Matched bad state "+curr_regex);
                return true;
            }
            else if(reverse_regex.test(state_part))
            {
                console.log("matched reverse state on "+reverse_regex+", x="+x+", my_query.state="+my_query.state);
                return true;
            }
        }
        if(bio_split.length===0) return false;
        begin_bio=bio_split[0]
        var city_state_reg=new RegExp(my_query.city+",?\\s*([A-Z]{2})"),city_state_match;
        console.log("city_state_reg="+city_state_reg);
        city_state_match=bio_text.match(city_state_reg);
        if(city_state_match && city_state_match[1]!==my_query.state)
        {
            console.log("Wrong state");
            return true;
        }

        return false;

    }

    /* Do twitter parsing */
    function do_twitter()
    {
        var result={success:true,twitter_url:"none",twitter_followers:"none"};
        console.log("Doing twitter");
        var bio=document.getElementsByClassName("ProfileHeaderCard-bio")[0];
        var location=document.getElementsByClassName("ProfileHeaderCard-locationText")[0];
        if(window.location.href.indexOf("https://twitter.com/i/cards")!==-1) { return; }
        var i,navstat;

        if(is_bad_twitter(bio, location))
        {
            console.log("Bad bio");
            result.success=false;
            GM_setValue("twitter_result",result);
            return;
        }
        result.twitter_url=window.location.href;
        navstat=document.getElementsByClassName("ProfileNav-stat");
        for(i=0; i < navstat.length; i++)
        {
            if(navstat[i].dataset.nav!==undefined && navstat[i].dataset.nav==="followers")
            {
                result.twitter_followers=navstat[i].getElementsByClassName("ProfileNav-value")[0].dataset.count;
                break;
            }
        }
        GM_setValue("twitter_result",result);

    }



    function init_Query()
    {
     //   var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var agency_match;
        my_query={agency_name:wT.rows[0].cells[1].innerText.trim(),query_name:"", city:wT.rows[1].cells[1].innerText.trim(),
                  county: wT.rows[2].cells[1].innerText.replace(/,.*$/,"").replace(/City and County of/,"").trim(),
                 state: wT.rows[3].cells[1].innerText.trim(),submitted:false,doneFB:false,doneTwitter:false,doneWebFB:false,
                  doneWebTwitter:false,webTwitter_url:"",webFB_url:"",agency_type:"Police",agency_number:"",
                 try_count:{"twitter":0,"facebook":0}};

        my_query.agency_name=my_query.agency_name.trim().replace(/[A-Z]{2}$/,function(match, offset, string) {
            if(reverse_state_map[match]!==undefined) return reverse_state_map[match];
            else return match;
        });
        console.log("New my_query.agency_name="+my_query.agency_name);
        agency_match=my_query.agency_name.match(/(.*)\s-\s([^,]*),\s*(.*)$/);
        if(agency_match) my_query.agency_type=agency_match[2].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");

        else
        {
            agency_match=my_query.agency_name.match(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/);
            if(agency_match) my_query.agency_type=agency_match[3].replace(/(^|\s)(Department|Dept. of)(\s|$)/i,"");
        }
        my_query.agency_name=my_query.agency_name.replace(/(.*)\s-\s([^,]*),\s*(.*)$/,"$1, $3 $2");
        my_query.agency_name=my_query.agency_name.replace(/([^,]*)\s*,\s*([^-]*)\s-\s*(.*)$/,"$1, $2 $3");
        console.log("New my_query.agency_name="+my_query.agency_name);

        my_query.short_name=my_query.agency_name.replace(/,.*$/,"")
        .replace(/(^|\s)(City|Town|Village|County|Municipality|Township|Borough|(?:State )?University|Community College|College)(\s|$)/i," ");
        if(!/Department of Justice/.test(my_query.short_name))
        {
            my_query.short_name=my_query.short_name

                .replace(/Police\s*(?:Department|Dept.?)?\s*/,"").replace(/\s*Detectives/,"");
        }
         my_query.short_name=my_query.short_name.replace(/Marshal(?:\'?s)(\s|$)(Office(\s|$))?/,"");
        my_query.short_name=my_query.short_name.trim();

        if(/Constable (?:Pct(?:\.)?|Precinct)\s(\d+)/.test(my_query.short_name))
        {
            my_query.agency_type="Constable";
            my_query.agency_number=my_query.short_name.match(/Constable (?:Pct(?:\.)?|Precinct)\s(\d+)/)[1];
            my_query.short_name=my_query.short_name.replace(/Constable (?:Pct(?:\.)?|Precinct)\s(\d+)/,"").trim();
        }
        my_query.short_name=my_query.short_name.replace(/(^|\s)\([^\)]+\)(\s|$)/,"");
        // Should never happen now
        if(/ - /.test(my_query.agency_name)) {
            console.log("Agency contains -, returning");

            GM_setValue("returnHit",true); return; }

        my_query.query_name=my_query.agency_name.replace(/(^|\s)(City|Town|Village|County|Municipality|Township|Borough)(\s|$)/i," ");
       // .replace(/(^|\s)of(\s|$)/i,"");
        console.log("my_query="+JSON.stringify(my_query));
        my_query.agency_type=my_query.agency_type.replace(/Sherrif/,"Sheriff");


        var search_str=my_query.agency_name;
        const bingPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search for bing");
            query_search(search_str, resolve, reject, query_response);
        });

        bingPromise.then(bing_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this bingPromise " + val); GM_setValue("returnHit",true); });





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
     else if(window.location.href.indexOf("facebook.com")!==-1)
    {
        GM_setValue("fb_url",{url:"https://www.facebook.com",website:false});
        console.log("Doing facebook");
        my_query=GM_getValue("my_query");

        GM_addValueChangeListener("fb_url",function() {
            var url=GM_getValue("fb_url").url;
            console.log("url="+url);
            window.location.href=url;
        });
        setTimeout(do_fb,2500);
    }
    else if(window.location.href.indexOf("twitter.com")!==-1)
    {
        GM_setValue("twitter_url",{url:"https://www.twitter.com",website:false});
        console.log("Doing twitter");
        my_query=GM_getValue("my_query");

        GM_addValueChangeListener("twitter_url",function() {
            window.location.href=arguments[2].url;
        });
        setTimeout(do_twitter,2500);
    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 35000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */


        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();
