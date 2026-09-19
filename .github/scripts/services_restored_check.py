# Compatibility entrypoint for the existing services verification workflow.
from services_qa import local, live
if __name__ == '__main__':
    {'local': local, 'live': live}[__import__('sys').argv[1]]()
