#!/usr/bin/env Rscript

# We need the plot.R module for result drawing
source('./server/schema/executors/R/plot.R')

# We are calling this script with Rscript projectPath file1 file2 ...
projectPath <- commandArgs(TRUE)[1] # This is where the projects output will be written to
filePath <- file.path(projectPath, '..') # Files are stored one level above of the project folder itself for sharing purposes
fileList <- unlist(strsplit(commandArgs(TRUE)[-1],","))


# Set the working directory to the users savePath. Much easier to work with relative paths
setwd(projectPath)

logFile <- 'logfile.txt'
errorFile <- 'error.txt'

# Collect status return codes from each qa function call
codes <- unlist(lapply(fileList, function(x) {
	system2("qa", file.path(filePath, x), stdout=stdout, stderr=stderr)
	}))

# If any of the return values was not 0 (i.e. error) get the first non-0 code and
# exit the script with that error code
if(any(codes != 0)) {
	firstCode <- which(codes != 0)
	quit(status=codes[firstCode])
}

pdf("quality-report.pdf")
par(bg="white")
	
read_base_dist()
read_length_dist()
read_phred_dist()
read_boxplotdata()

dev.off()