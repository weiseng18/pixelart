file = open("../raw/pencil.pix").readlines()[0]

lines = file.split(";")

corrected = []

for line in lines:
	splitted = line.split(",")
	if len(splitted) == 32:
		corrected.append(splitted)
		continue
	else:
		row = []
		count = 0
		while count < len(splitted):
			if splitted[count] == "null" or splitted[count][0] == '#':
				row.append(splitted[count])
				count += 1
			else:
				combined = splitted[count] + "," + splitted[count+1] + "," + splitted[count+2]
				row.append(combined)
				count += 3

		corrected.append(row)

newFile = open("pencil.pix", "w")

for i in range(32):
	if i:
		newFile.write(';')
	for j in range(32):
		if j:
			newFile.write('.')
		newFile.write(corrected[i][j])