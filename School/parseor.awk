BEGIN { school="";street="";city="";state="OR";zip="";name="";title="";phone="";email="";counter=0;
}

/^--$/ {
    if(length(school)>0)  {
	printf "%s,%s,%s,%s,%s,%s,%s,%s,%s\n",school,street,city,state,zip,name,title,phone,email;
    }
    counter=0;
    school="";street="";city="";state="OR";zip="";name="";title="";phone="";email="";
}
/^[^-]/ {
    counter=counter+1;
    if(counter==1) {
	school=$0;
    }
    if(counter==3) {
	if(match($0,/^(.*)\s*(Principal|Director|(Head )?Teacher|Administrator|Superintendent) (.*)$/,arr))
	{
	    street=arr[1];
	    title=arr[2];
	    phone=arr[4];
	}
	else if(match($0,/^(.*)\s+([^ ]+)$/,arr)) {
	    street=arr[1];
	    email=arr[2];
	}
    }
    if(counter==4) {
	if(match($0,/^([^,]*),\s*(OR)\s+([\-[:digit:]]*)\s*([A-Z]{1}[A-Za-z\.\-\' ]+)\s*(Fax (.*))?$/,arr)) {
	    city=arr[1];
	    zip=arr[3];
	    name=arr[4];
	    #phone=arr[5];
	}
	else if(match($0,/([A-Z]{1}[a-z\.\-\']+ [A-Z]{1}[a-z\.\-\']+)\s*(Fax (.*))?$/,arr)) {
	    name=arr[1];
	}
	else if(match($0,/^([^,]*),\s*(OR)\s+([\-[:digit:]]*)/,arr)) {
	    city=arr[1];
	    zip=arr[3];
	}
    }
    if(counter==5) {
	if(match($0,/([^ ]+@[^ ]+)$/,arr)) email=arr[1];
	else if(match($0,/^Superintendent ([A-Za-z ]+)\s*([\-[:digit:]]*)?$/,arr)) {
	    name=arr[1];
	    title="Superintendent";
	    phone=arr[2];
	}
    }
#    printf "%s\n",$0;
}
