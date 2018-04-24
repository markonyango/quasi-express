#!/usr/bin/env Rscript

# Import functions that do the actual analysis
# The path is relative to the Node entry point aka server root
#source('./server/schema/executors/R/deaFunctions.R')

savePath = commandArgs(T)[1]
matrixFile = commandArgs(T)[2]
conds = commandArgs(T)[3]
deaPairs = trimws(unlist(strsplit(commandArgs(T)[4], ";")))
deaPackages = trimws(unlist(strsplit(commandArgs(T)[5], ",")))
correlateSamples = commandArgs(T)[6]
significanceLevel = commandArgs(T)[7]

# Create global countMatrix which will be used by all DEA packages
ct = read.delim(matrixFile, header=TRUE, stringsAsFactors=TRUE)
rownames(ct) = ct$name
ct = ct[,-1]

# Sanity check: is the number of entered conditions equal to the number of columns in the file
if(length(conds) != ncol(ct)){
  write("Conditions provided:", stderr())
  write(conds, stderr())
  write("Conditions from matrix file:", stderr())
  write(colnames(ct), stderr())
  stop("The number of entered conditions does not match the number of columns in the count matrix file!")
}
    
    
# Correlating each sample with each other - only when there is more than one file
#if(correlateSamples) correlate_samples()

print(paste("Savepath:",savePath))
print(paste("matrixFile:", matrixFile))
print(paste("Conditions:",conds))
print(paste("Pairs:", deaPairs))
print(paste("Packages:", deaPackages))
print(paste("Correlate Samples:", correlateSamples))
print(paste("Alpha:", significanceLevel))
