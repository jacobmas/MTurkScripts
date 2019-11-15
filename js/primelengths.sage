def compute_tests(low,high):
    for p in list(primes(low,high)):
        R.<x>=GF(p)[]
        t=list(factor(x^3-x-1))
        len_list=[]
        #print("{0},{1}".format(p,t))
        for (y,z) in t:
            print("y={0},z={1}".format(y,z))
        print("\n\n")
        
