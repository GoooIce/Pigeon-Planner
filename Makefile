help:
	@echo "  clean       remove unwanted stuff"
	@echo "  test        run tests using nose"
	@echo "  po          update the pot-file"
	@echo "  mo          compile languages"
	@echo "  sdist       package source"

clean:
	rm -fr build
	rm -fr dist
	find . -name '*.pyc' -exec rm -f {} \;
	find . -name '*.pyo' -exec rm -f {} \;
	find . -name '*~' -exec rm -f {} \;

test:
	nosetests-2.7 tests

po:
	python i18n.py -p

mo:
	python i18n.py -m

sdist:
	python setup.py sdist

release: clean test mo sdist

